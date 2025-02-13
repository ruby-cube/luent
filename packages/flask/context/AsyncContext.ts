import { Callback } from "../flaskableListeners";

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
   // getCurrent(): T | undefined;
}

type GetContextualState<T> = () => T | undefined
type SetContextualState<T> = (state: T) => void


export function AsyncState<T>(name: string): [GetContextualState<T>, SetContextualState<T>, Stack<T>] {
   // const { name, getParent } = config;
   // if (getParent) {
   //    let prevNode: T | undefined;
   //    let activeNode: T | undefined;

   //    const stack = {
   //       push(node: T) {
   //          prevNode = activeNode;
   //          activeNode = node;
   //          if (activeNode) {
   //             asyncContextStack.activeNodes.set(name, activeNode)
   //          }
   //       },
   //       pop() {
   //          activeNode = prevNode
   //          prevNode = getParent(prevNode)
   //          if (activeNode)
   //             asyncContextStack.activeNodes.set(name, activeNode)
   //          else {
   //             asyncContextStack.activeNodes.delete(name)
   //          }
   //       },
   //       getCurrent() {
   //          return activeNode;
   //       }
   //    }
   //    asyncContextStack.stacks.set(name, stack)
   //    return stack;
   // }

   const _stack: T[] = [];

   function push(node: T) {
      _stack.push(node)
      if (_stack.length) {
         asyncContextStack.activeNodes.set(name, node)
      }
   }
   const stack = {
      push,
      pop() {
         _stack.pop();
         if (_stack.length)
            asyncContextStack.activeNodes.set(name, _stack.at(-1))
         else
            asyncContextStack.activeNodes.delete(name)

      }
   }

   asyncContextStack.stacks.set(name, stack)
   return [
      function getCurrentState() {
         return _stack.at(-1)
      },
      push,
      stack
   ];
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


export function wrapWithContext(callback: Callback, config: {
   beforeCall?: () => void,
   afterCall?: () => void,
}) {
   const { afterCall, beforeCall } = config
   const context = $_snap_context()

   return (...args: any[]) => {
      try {
         asyncContextStack.push(context);
         if (beforeCall) beforeCall()
         callback(...args)
      }
      finally {
         if (afterCall) afterCall()
         asyncContextStack.pop()
      }
   }
}

export function callWithContext(config: {
   callback: () => any,
   context?: Map<any, any>,
   beforeCall?: () => void,
   afterCall?: () => void,
}) {
   const { afterCall, beforeCall, callback, context } = config
   try {
      if (context) asyncContextStack.push(context);
      if (beforeCall) beforeCall()
      return callback()
   }
   finally {
      if (afterCall) afterCall()
      asyncContextStack.pop()
   }
}