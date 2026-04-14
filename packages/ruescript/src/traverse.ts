import { createStack } from "@rue/utils";
import { CHILD_KEYS } from "./ast";

// #region: Types adapted from @svelte/zimmerframe

type BaseNode = {
   type: string;
   parent?: undefined | BaseNode | null
   path?: [string] | [string, string] // key, index
};

type NodeOf<K extends string, X> = X extends { type: infer T } ? K extends T ? X : never : never;

type Visitors<T extends BaseNode, C> = {
   [K in T['type']]?: Visit<NodeOf<K, T>, C>;
};
type Visit<T extends BaseNode, C> = (this: Cursor<C, T>, node: T, context: C) => void;

// #endregion

class InternalError extends Error { }


export function traverse<T extends BaseNode, C>(ast: T, context: C & object, visitors: Visitors<T, C>) {

   const proxyMap = new Map<BaseNode | BaseNode[], BaseNode | BaseNode[]>()
   const missingChildKeysWarnings = new Set<string>()
   const cursor = new Cursor(visitors, CHILD_KEYS, context)
   
   cursor.enterScope()
   try {
      cursor.visit(NodeProxy(ast), context)
   }
   finally {
      cursor.exitScope()
   }
   
   function NodeProxy(node: BaseNode, parent?: BaseNode, path?: [string] | [string, string]) {
      if (proxyMap.has(node)) return proxyMap.get(node) as BaseNode
      const proxy = new Proxy(node, {
         get(target, key) {
            if (key === PROXY) return true;
            if (key === 'parent') return parent;
            if (key === 'path') return path;
            const value = target[key as keyof BaseNode]
            if (typeof key !== 'string') return value;
            if (isNode(value)) {
               return NodeProxy(value, target, [key])
            }
            // NOTE: 'Property' and 'key' are just examples to suppress ts errors
            const keys = CHILD_KEYS[target.type as 'Property']
            if (!keys) {
               if (!missingChildKeysWarnings.has(target.type)) {
                  missingChildKeysWarnings.add(target.type)
                  console.warn('child keys do not exist for', target.type)
               }
               // fallback
               if (isNode(value)) {
                  return NodeProxy(value, target, [key])
               }
               if (value instanceof Array && value.some(isNode)) {
                  return NodeListProxy(value as unknown as BaseNode[], target, key)
               }
               return value;
            }
            if (keys.indexOf(key as 'key') !== -1 && value instanceof Array) {
               return NodeListProxy(value as unknown as BaseNode[], target, key)
            }
            return value
         }
      })
      proxyMap.set(node, proxy)
      return proxy
   }

   function NodeListProxy(nodes: BaseNode[], parent: BaseNode, key: string) {
      if (proxyMap.has(nodes)) return proxyMap.get(nodes)!
      const proxy = new Proxy(nodes, {
         get(target, index) {
            if (index === PROXY) return true;
            if (index === 'parent') return parent;
            const value = target[index as keyof any[]]
            if (typeof index !== 'string') return value;
            if (isNode(value)) {
               return NodeProxy(value, parent, [key, index])
            }
            return value
         }
      })
      proxyMap.set(nodes, proxy)
      return proxy
   }

   return {
      ast,
      transformed: cursor.applyTransformations()
   }
}


const PROXY = Symbol('proxy')





class Scope {
   private variables: Set<string>

   constructor(parent: Scope | undefined) {
      this.variables = new Set(parent?.variables)
   }

   addVariable(name: string) {
      this.variables.add(name)
   }

   has(name: string) {
      return this.variables.has(name)
   }
}

interface ScopeStack {
   push(scope: Scope): Scope,
   pop(): void,
   get(): Scope | undefined
}

/**
 * This implementation assumes each node in the ast is a unique object
 */
class Cursor<C, T extends BaseNode> {
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
      private visitors: Visitors<T, C>,
      private childKeys: { [key: string]: string[] },
      private context: C,
      private visited = new Set()
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

   visit<N>(node: N & BaseNode, context?: C) {
      if (this.visited.has(node)) {
         console.warn('node has already been visited', node)
         return;
      }
      this.visited.add(node)
      try {
         const visit = (this.visitors as Visitors<BaseNode, C>)[node.type]
         if (context) this.pushContext(context)
         if (visit) {
            visit.apply(this, [node, context ?? this.getContext() ?? this.context])
         }
         else {
            this.autovisit(node, this)
         }
      }
      finally {
         if (context) this.popContext()
      }
   }

   autovisit(node: BaseNode, cursor: Cursor<C, T>) {
      const childKeys = this.childKeys[node.type]
      if (!childKeys) {
         console.warn('child keys do not exist for', node.type)
         return;
      }
      for (const key of childKeys) {
         const nested = node[key as keyof BaseNode] as BaseNode | BaseNode[]
         if (nested instanceof Array) {
            for (const node of nested) {
               cursor.visit(node)
            }
         }
         else if (isNode(nested)) {
            cursor.visit(nested)
         }
      }
   }

   private transforms: (() => void)[] = []

   private getParentAndPath(node: BaseNode) {
      const path = node.path
      const parent = node.parent as BaseNode & { [key: string]: BaseNode | BaseNode[] | null }
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

   /**
    * Queues replacement for after tree has been fully traversed. Must be called synchronously to visitor.
    * Should not be called from a parent of node being replaced (use willMutate instead). Node be replaced must be directly visited.
    */
   willReplace(node: BaseNode, other: BaseNode | BaseNode[]) {
      this.transforms.push(() => {
         const { parent, path } = this.getParentAndPath(node)
         const [key, index] = path
         if (index) {
            const array = parent[key] as BaseNode[]
            if (other instanceof Array) {
               array.splice(parseInt(index), 1, ...other)
            }
            else {
               array[index as any] = other
            }
         }
         else {
            parent[key] = other
         }
      })
   }

   /**
    * Queues removal for after tree has been fully traversed. Must be called synchronously to visitor.
    */
   willRemove(node: BaseNode) {
      this.transforms.push(() => {
         const { parent, path } = this.getParentAndPath(node)
         const [key, index] = path
         if (index) {
            const array = parent[key] as BaseNode[]
            array.splice(parseInt(index), 1)
         }
         else {
            parent[key] = null
         }
      })
   }

   private insert(node: BaseNode, other: BaseNode | BaseNode[], offset: 1 | 0 = 0) {
      const { parent, path } = this.getParentAndPath(node)
      const [key, index] = path
      if (index) {
         const array = parent[key] as BaseNode[]
         if (other instanceof Array) {
            array.splice(parseInt(index) + offset, 0, ...other)
         }
         else {
            array.splice(parseInt(index) + offset, 0, other)
         }
         return;
      }
      console.warn('Cannot insert before node that is not an array element', node)
   }

   /**
    * Queues insertion for before tree has been fully traversed. Must be called synchronously to visitor.
    */
   willInsertBefore(node: BaseNode, other: BaseNode | BaseNode[]) {
      this.transforms.push(() => {
         this.insert(node, other)
      })

   }

   /**
    * Queues insertion for after tree has been fully traversed. Must be called synchronously to visitor.
    */
   willInsertAfter(node: BaseNode, other: BaseNode | BaseNode[]) {
      this.transforms.push(() => {
         this.insert(node, other, 1)
      })
   }

   applyTransformations(): boolean {
      const transforms = this.transforms
      if (!transforms.length) return false;

      for (const transform of transforms) {
         transform()
      }

      return true;
   }
}


function isNode(value: unknown): value is BaseNode {
   return !!value && typeof value === 'object' && 'type' in value
}
