export type ContextSnapshot = Record<Key, any>
type Key = string | symbol
class AsyncContextStack {

   stacks: Record<Key, Stack> = {}

   stackKeys: Key[] = []
   activeNodes: ContextSnapshot = {}

   push(context: ContextSnapshot) {
      this.activeNodes = context //QUESTION: clone the context here? is that necessary
      const stacks = this.stacks;
      const keys = this.stackKeys;
      for (const key of keys) {
         const stack = stacks[key]
         const node = context[key]
         if (stack) stack.push(node)
      }
   }

   pop() {
      const stacks = this.stacks;
      const keys = this.stackKeys;
      for (const key in keys) {
         const stack = stacks[key]
         if (stack) stack.pop()
      }
   }
}

export function $_snap_context() {
   return { ...asyncContextStack.activeNodes }
}

export const asyncContextStack = new AsyncContextStack()

export type Stack<T = any> = {
   pop(): void;
   push(node: T): void;
}

type GetContextualState<T> = () => T | undefined
// type SetContextualState<T> = (state: T) => void


export function AsyncState<T>(name: Key): [GetContextualState<T>, Stack<T>] {
   asyncContextStack.stackKeys.push(name)

   const _stack: T[] = [];

   function push(node: T) {
      _stack.push(node)
      if (_stack.length) {
         asyncContextStack.activeNodes[name] = node
      }
   }
   const stack = {
      _stack,
      get length() {
         return _stack.length;
      },
      push,
      pop() {
         if (name === 'current effect' && _stack.length === 1) console.trace('!!popping')
         const item = _stack.pop();
         if (_stack.length)
            asyncContextStack.activeNodes[name] = _stack.at(-1)
         else
            asyncContextStack.activeNodes[name] = null
         return item;
      }
   }

   asyncContextStack.stacks[name] = stack

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

export function $_wrap_with_context(fn: Function) {
   const context = $_snap_context()
   return () => {
      $_run_with_(context, fn)
   }
}