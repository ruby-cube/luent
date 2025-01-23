// const nodeStack = createStack({
//    name: 'dynamic node',
//    parentKey: 'parent'

import { context } from "../../lumo/src/context/Commons";
import { asyncTrace } from "../debug";

// })
type ActiveNodes = Map<string | symbol, any>

class AsyncContextStack {

   stacks: Map<string | symbol, Stack> = new Map()

   activeNodes: ActiveNodes = new Map()

   push(activeNodes: ActiveNodes) {
      const nodes = this.activeNodes = new Map(activeNodes);
      const stacks = this.stacks;
      for (const [name, node] of nodes) {
         const stack = stacks.get(name)
         if (stack) stack.push(node)
      }
   }

   pop() {
      const activeNodes = this.activeNodes
      const stacks = this.stacks;
      for (const [name] of activeNodes) {
         const stack = stacks.get(name)
         if (stack) stack.pop()
      }
   }
}

export function $_snap_context() {
   return new Map(asyncContextStack.activeNodes)
}

export const asyncContextStack = new AsyncContextStack()

export type Stack<T = any> = {
   pop(): void;
   push(node: T): void;
   getActiveNode(): T | undefined;
}

export function createStack<T>(config: { name: string | symbol, parentKey?: keyof T }): Stack {
   const { name, parentKey } = config;
   if (parentKey) {
      let prevNode: T | undefined;
      let activeNode: T | undefined;

      const stack = {
         push(node: T) {
            prevNode = activeNode;
            activeNode = node;
            if (activeNode) {
               asyncContextStack.activeNodes.set(name, activeNode)
            }
         },
         pop() {
            activeNode = prevNode
            prevNode = (prevNode ? prevNode[parentKey] : undefined) as T
            if (activeNode)
               asyncContextStack.activeNodes.set(name, activeNode)
            else {
               asyncContextStack.activeNodes.delete(name)
            }
         },
         getActiveNode() {
            return activeNode;
         }
      }
      asyncContextStack.stacks.set(name, stack)
      return stack;
   }

   const _stack: T[] = [];
   const stack = {
      push(node: T) {
         _stack.push(node)
         if (_stack.length) {
            asyncContextStack.activeNodes.set(name, node)
         }
      },
      pop() {
         _stack.pop();
         if (_stack.length)
            asyncContextStack.activeNodes.set(name, _stack.at(-1))
         else
            asyncContextStack.activeNodes.delete(name)

      },
      getActiveNode() {
         return _stack.at(-1)
      }
   }
   asyncContextStack.stacks.set(name, stack)
   return stack;
}


export function $_wrap_with_(context: ActiveNodes, fn: Function) {
   return () => $_run_with_(context, fn)

}

export function $_run_with_(context: ActiveNodes, fn: Function) {
   try {
      asyncContextStack.push(context);
      return fn()
   } finally {
      asyncContextStack.pop()
   }
}