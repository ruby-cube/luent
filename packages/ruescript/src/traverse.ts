import { ArrowFunctionExpression, Function, Program, VariableDeclaration } from "oxc-parser";
import { createStack } from "../../utils/index.ts";
import { CHILD_KEYS } from "./ast.ts";
import { ACCESSOR_VARIABLE_POSTFIX } from "./3-transform.ts";
import { LinkedNode, toLinkedList } from "./linked-nodes.ts";

// #region: Types adapted from @svelte/zimmerframe

type BaseNode = {
   type: string;
   parent?: undefined | BaseNode | null
   path?: [string] | [string, string] // key, index
};

type BaseNodeProxy = BaseNode & { [PROXY]: boolean }

type NodeOf<K extends string, X> = X extends { type: infer T } ? K extends T ? X : never : never;

type Visitors<T extends BaseNode, C> = {
   [K in T['type']]?: Visit<T, NodeOf<K, T>, C>;
};

type Visit<T extends BaseNode, N extends BaseNode, C> = (this: Cursor<T, C>, node: N, context: C) => void;

// #endregion




export function traverse<T extends BaseNode, C>(ast: T, context: C & object, visitors: Visitors<T, C>) {
   const cursor = new Cursor<T, C>(CHILD_KEYS, context, visitors)

   cursor.enterScope()
   try {
      cursor.visit(ast, context)
   }
   finally {
      cursor.exitScope()
   }

   return {
      ast,
      transformed: cursor.applyTransformations()
   }
}

export function traverseAll<T extends BaseNode, C>(ast: T, context: C & object, visitors: { visit: Visit<T, T, C> }) {

   const cursor = new Cursor<T, C>(CHILD_KEYS, context, undefined, visitors.visit)

   cursor.enterScope()
   try {
      cursor.visit(ast, context)
   }
   finally {
      cursor.exitScope()
   }

   return {
      ast,
      transformed: cursor.applyTransformations()
   }
}





export class Scope {
   // private variables: Set<string>
   private absorbedGetters: Map<string, VariableDeclaration | Function | ArrowFunctionExpression> = new Map()

   constructor(private parent: Scope | undefined) {
      // this.variables = new Set(parent?.variables)
   }

   // addVariable(name: string) {
   //    this.variables.add(name)
   // }

   // has(name: string) {
   //    return this.variables.has(name)
   // }

   addAbsorbedGetter(name: string, declaration: VariableDeclaration | Function | ArrowFunctionExpression) {
      console.log('add', name)
      this.absorbedGetters.set(name, declaration)
   }

   getAbsorbedGetterDeclaration(name: string) {
      const variable = name.endsWith(ACCESSOR_VARIABLE_POSTFIX) ? name.slice(0, -1) : name
      let scope: undefined | Scope = this;
      while (scope) {
         const result = scope.absorbedGetters.get(variable)
         if (result) {
            return result;
         }
         scope = scope.parent
      }
      return undefined;
   }

   private typeGuarded = new Set<string>()

   markTypeGuarded(name: string) {
      this.typeGuarded.add(name)
   }
   
   isTypeGuarded(name: string) {
      return this.typeGuarded.has(name)
   }
}

interface ScopeStack {
   push(scope: Scope): Scope,
   pop(): void,
   get(): Scope | undefined
}


const PROXY = Symbol('proxy')
const RAW = Symbol('raw')
const SOURCE_LIST = Symbol('source_list')

/**
 * This implementation assumes each node in the ast is a unique object
 */
export class Cursor<T extends BaseNode, C> {
   private pushContext: (value: C) => C;
   private popContext: () => void;
   private getContext: () => C | undefined;

   enterScope() {
      return this.scopeStack.push(new Scope(this.scopeStack.get()))
   }

   exitScope() {
      return this.scopeStack.pop()
   }

   get scope() {
      const scope = this.scopeStack.get()
      if (!scope) throw new InternalError('no scope :(')
      return scope;
   }

   private scopeStack: ScopeStack

   constructor(
      private childKeys: { [key: string]: string[] },
      private context: C,
      private visitors?: Visitors<T, C>,
      private visitor?: Visit<T, NodeOf<T['type'], T>, C>
   ) {
      const [pushScope, popScope, getScope] = createStack<Scope>()
      const [pushContext, popContext, getContext] = createStack<C>()
      this.scopeStack = {
         push: pushScope,
         pop: popScope,
         get: getScope
      }
      this.pushContext = pushContext;
      this.popContext = popContext;
      this.getContext = getContext;
   }

   private visited = new Set()

   visit<N extends BaseNode>(node: N, context?: C) {
      if (!(node as BaseNodeProxy & N)[PROXY]) node = this.NodeProxy(node as T & N) as T & N
      if (this.skipped.has(node)) return;
      if (this.visited.has(node)) {
         console.warn('node has already been visited', node)
         return;
      }
      this.visited.add(node)
      try {
         const visit = (this.visitors as Visitors<BaseNode, C>)?.[node.type] ?? this.visitor as Visit<BaseNode, BaseNode, C>
         if (context) this.pushContext(context)
         if (visit) {
            visit.apply(this as Cursor<BaseNode, C>, [node, this.getContext() ?? this.context])
         }
         else {
            this.visitChildren(node as T & N, this.getContext() ?? this.context)
         }
      }
      finally {
         if (context) this.popContext()
      }
   }

   visitEach<N extends BaseNode>(nodes: N[], context?: C) {
      nodes.forEach(node => {
         if (isNode(node)) {
            this.visit(node, context)
         }
      })
   }

   skipped = new Set();

   skip<N extends BaseNode>(node: N) {
      this.skipped.add(node)
   }

   visitChildren(node: T, context?: C) {
      const childKeys = this.childKeys[node.type] ?? Object.keys(node)
      for (const key of childKeys) {
         const nested = node[key as keyof T] as T | T[]
         if (nested instanceof Array && nested.some(isNode)) {
            for (const child of nested) {
               if (isNode(child)) {
                  this.visit(child, context)
               }
            }
         }
         else if (isNode(nested)) {
            this.visit(nested, context)
         }
      }
   }

   // #region: transforms

   private transforms: (() => void)[] = []

   private getParentAndPath(node: T) {
      const path = node.path
      const parent = node.parent as T & { [key: string]: T | T[] | null }
      if (!parent) throw new InternalError('Parent is missing')
      if (!path) throw new InternalError('Path is missing')
      return { parent, path }
   }

   /**
    * Queues mutation for after tree has been fully traversed. Must be called synchronously to visitor.
    */
   willMutate(mutation: () => void) {
      this.transforms.push(mutation)
   }

   private replacements = new Map<T, T | T[]>()

   private findReplacement(node: T, dir: 'L' | 'R') {
      let current: T | undefined = node
      while (current) {
         const replacement = this.replacements.get(current)
         if (!replacement) return current;
         if (replacement instanceof Array) {
            if (replacement.length === 0) return current
            current = dir === 'R' ? replacement.at(-1) : replacement[0]
         }
         else {
            current = replacement
         }
      }
      return node
   }

   /**
    * Queues replacement for after tree has been fully traversed. Must be called synchronously to visitor.
    */
   willReplace(node: T, other: T | T[]) {
      const proxy = this.asProxy(node)
      if (!proxy) {
         console.warn('Only nodes on the original ast as passed in through the visitor may be replaced. Use `willMutate` instead.')
         return;
      }
      this.replacements.set(node, other)
      this.transforms.push(() => {
         const { parent, path } = this.getParentAndPath(node)
         const [key, index] = path
         if (index) {
            const array = parent[key] as T[]
            if (other instanceof Array) {
               array.splice(parseInt(index), 1, ...other)
            }
            else {
               array[index as any] = other
            }
         }
         else {
            (parent as { [key: string]: T | T[] })[key] = other
         }
      })
   }

   /**
    * Queues removal for after tree has been fully traversed. Must be called synchronously to visitor.
    */
   willRemove(node: T) {
      const proxy = this.asProxy(node)
      if (!proxy) {
         console.warn('Only nodes on the original AST (as passed in through the visitor) may be removed. Use `willMutate` instead.')
         return;
      }
      this.transforms.push(() => {
         const { parent, path } = this.getParentAndPath(proxy)
         const [key, index] = path
         if (index) {
            const array = parent[key] as T[]
            array.splice(parseInt(index), 1)
         }
         else {
            (parent as { [key: string]: T | T[] | null })[key] = null
         }
      })
   }

   private insert(node: T, other: T | T[], offset: 1 | 0 = 0) {
      const { parent, path } = this.getParentAndPath(node)
      const [key, originalIndex] = path
      const array = parent[key] as T[]

      const anchor: LinkedNode & BaseNode = this.findReplacement(node, offset ? 'R' : 'L')
      const ref = offset ? this.findPrev(anchor) : this.findNext(anchor)
      const index = ref ? array.indexOf(ref as T) : offset ? -1 : array.length
      const i = index === -1 ? originalIndex ? parseInt(originalIndex) : undefined : index
      if (i !== undefined) {
         if (other instanceof Array) {
            array.splice(i + offset, 0, ...other)
         }
         else {
            array.splice(i + offset, 0, other)
         }
         return;
      }
      console.warn('Cannot insert before node that is not an array element', node)
   }

   private findPrev(node: BaseNode & LinkedNode) {
      let current: BaseNode & LinkedNode | undefined | null = node;
      while (current) {
         if (!current.removed) return current
         current = node.prev as BaseNode
      }
   }

   private findNext(node: BaseNode & LinkedNode) {
      let current: BaseNode & LinkedNode | undefined | null = node;
      while (current) {
         if (!current.removed) return current
         current = node.next as BaseNode
      }
   }

   /**
    * Queues insertion for before tree has been fully traversed. Must be called synchronously to visitor.
    */
   willInsertBefore(node: T, other: T | T[]) {
      const proxy = this.asProxy(node)
      if (!proxy) {
         console.warn('Nodes may only be inserted relative to nodes on the original AST (as passed in through the visitor). Use `willMutate` instead.')
         return;
      }
      this.transforms.push(() => {
         this.insert(proxy, other)
      })
   }

   /**
    * Queues insertion for after tree has been fully traversed. Must be called synchronously to visitor.
    */
   willInsertAfter(node: T, other: T | T[]) {
      const proxy = this.asProxy(node)
      if (!proxy) {
         console.warn('Nodes may only be inserted relative to nodes on the original AST (as passed in through the visitor). Use `willMutate` instead.')
         return;
      }
      this.transforms.push(() => {
         this.insert(proxy, other, 1)
      })
   }

   private asProxy(node: T) {
      if (!(node as BaseNodeProxy & T)[PROXY]) {
         return this.proxyMap.get(node) as T
      }
      return node;
   }

   applyTransformations(): boolean {
      const transforms = this.transforms
      if (!transforms.length) return false;

      for (const transform of transforms) {
         transform()
      }

      return true;
   }

   // #endregion

   // #region: Node Proxies with parent and path

   private proxyMap = new Map<T | T[], T | T[]>()
   private missingChildKeys = new Set<string>()

   private toRaw(node: T) {
      const value =
         //@ts-expect-error
         node[RAW]
      if (value) return value;
      return node
   }

   private NodeProxy(node: T, parent?: T, path?: [string] | [string, string]) {
      const raw = this.toRaw(node)
      if (parent) raw.parent = this.NodeProxy(parent)
      if (path) raw.path = path;
      if (this.proxyMap.has(raw)) {
         return this.proxyMap.get(raw) as T
      }
      const cursor = this;
      const proxy = new Proxy(node, {
         get(target, key) {
            if (key === RAW) return target;
            if (key === PROXY) return true;
            // if (key === 'parent') return parent ? cursor.NodeProxy(parent) : parent;
            // if (key === 'path') return path;
            const value = target[key as keyof T]
            if (typeof key !== 'string') return value;
            if (isNode<T>(value)) {
               return cursor.NodeProxy(value, target, [key])
            }
            // NOTE: 'Property' and 'key' are just examples to suppress ts errors
            const keys = cursor.childKeys[target.type as 'Property']
            if (!keys) {
               if (!cursor.missingChildKeys.has(target.type)) {
                  cursor.missingChildKeys.add(target.type)
                  console.warn('child keys do not exist for', target.type)
               }
               // fallback
               if (isNode<T>(value)) {
                  return cursor.NodeProxy(value, target, [key])
               }
               if (value instanceof Array && value.some(isNode)) {
                  return cursor.NodeListProxy(value, target, key)
               }
               return value;
            }
            if (keys.indexOf(key as 'key') !== -1 && value instanceof Array) {
               return cursor.NodeListProxy(value, target, key)
            }
            return value
         }
      })
      this.proxyMap.set(node, proxy)
      return proxy
   }

   private NodeListProxy(nodes: T[], parent: T, key: string) {
      if (this.proxyMap.has(nodes)) return this.proxyMap.get(nodes)!
      const list = toLinkedList<BaseNode & LinkedNode>(nodes)
      const cursor = this;
      const proxy = new Proxy(nodes, {
         get(target, index) {
            if (index === PROXY) return true;
            if (index === 'parent') return parent;
            if (index === SOURCE_LIST) return list;
            if (index === 'splice') return (start: number, deleteCount: number, ...items: T[]) => {
               const removed = target.splice(start, deleteCount, ...items)
               if (deleteCount) {
                  for (const item of removed) {
                     (item as LinkedNode).removed = true
                  }
               }
               if (items) {
                  const prev: LinkedNode & BaseNode | undefined = removed.at(-1)
                  const next: LinkedNode & BaseNode | undefined = target[start + deleteCount]
                  if (prev) {
                     prev.next = list.head
                     list.head!.next = prev
                  }
                  if (next) {
                     next.prev = list.tail
                     list.tail!.next = next
                  }
               }
               return removed
            }
            const value = target[index as keyof any[]]
            if (typeof index !== 'string') return value;
            if (isNode(value)) {
               return cursor.NodeProxy(value, parent, [key, index])
            }
            return value
         }
      })
      this.proxyMap.set(nodes, proxy)
      return proxy
   }

   // #endregion

}



class InternalError extends Error { }


function isNode<T extends BaseNode>(value: unknown): value is T {
   return !!value && typeof value === 'object' && 'type' in value
}
