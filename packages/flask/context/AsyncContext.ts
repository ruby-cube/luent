type ContextSnapshot = Map<string | symbol, any>

class AsyncContextStack {

   stacks: Map<string | symbol, Stack> = new Map()

   activeNodes: ContextSnapshot = new Map()

   push(context: ContextSnapshot) {
      const nodes = this.activeNodes = new Map(context);
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
}

type GetContextualState<T> = () => T | undefined
// type SetContextualState<T> = (state: T) => void


export function AsyncState<T>(name: string): [GetContextualState<T>, Stack<T>] {

   const _stack: T[] = [];

   function push(node: T) {
      _stack.push(node)
      if (_stack.length) {
         asyncContextStack.activeNodes.set(name, node)
      }
   }
   const stack = {
      get length(){
         return _stack.length;
      },
      push,
      pop() {
         if (name === 'current effect' && _stack.length === 1) console.trace('!!popping')
         const item = _stack.pop();
         if (_stack.length)
            asyncContextStack.activeNodes.set(name, _stack.at(-1))
         else
            asyncContextStack.activeNodes.delete(name)
         return item;
      }
   }

   asyncContextStack.stacks.set(name, stack)

   return [
      function getCurrentState() {
         return _stack.at(-1)
      },
      stack
   ];
}


export function $_run_with_(context: ContextSnapshot, fn: Function) {
   try {
      asyncContextStack.push(context);
      return fn();
   } finally {
      asyncContextStack.pop()
   }
}
