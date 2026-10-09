import { AnyObject } from "@luently/types"

export type ContextSnapshot = Record<Key, StackNode<any> | undefined>

type Key = string | symbol

class AsyncContextStack {

   stacks: Record<Key, Stack> = {}

   stackKeys: Key[] = []
   current: StackNode<ContextSnapshot> | undefined = { value: {}, prev: undefined }

   push(context: ContextSnapshot) {
      this.current = { value: context, prev: this.current }
      // this.activeNodes = context //QUESTION: clone the context here? is that necessary
      // const stacks = this.stacks;
      // const keys = this.stackKeys;
      // for (const key of keys) {
      //    const stack = stacks[key]
      //    const node = context[key]
      //    if (stack && node) stack.push(node.value)
      // }
   }

   pop() {
      if (this.current) this.current = this.current.prev
      // const stacks = this.stacks;
      // const keys = this.stackKeys;
      // for (const key of keys) {
      //    const stack = stacks[key]
      //    if (stack) stack.pop()
      // }
   }
}

export function $_snap_context() {
   const snapshot: ContextSnapshot = {}
   const keys = asyncContextStack.stackKeys;
   const currentContext = asyncContextStack.current;
   if (!currentContext) return snapshot;
   for (const key of keys) {
      const stackNode = currentContext.value[key] //QUESTION: do I need to clone the stack node or can I just reference it?
      if (!stackNode) continue
      
      snapshot[key] = {
         prev: stackNode.prev,
         value: stackNode.value
      }
   }
   return snapshot
}

export const asyncContextStack = new AsyncContextStack()


export type Stack<T = any> = {
   push(node: T, context?: ContextSnapshot): void;
   pop(context?: ContextSnapshot): T | undefined;
}

interface StackNode<T> {
   value: T;
   prev: StackNode<T> | undefined;
}

export function getCurrentContext() {
   const contextNode = asyncContextStack.current
   if (!contextNode) {
      if ( __DEV__) throw Error('No context :( This should never happen')
      return;
   }
   return contextNode.value
}

export function AsyncState<T>(name: Key) {
   asyncContextStack.stackKeys.push(name)

   function push(value: T, context = getCurrentContext()) {
      if (!context) return;
      context[name] = { value, prev: context[name] }
   }

   function pop(context = getCurrentContext()): T | undefined {
      if (!context) return;
      const current = context[name]
      if (current) {
         const value = current.value;
         context[name] = current.prev
         return value
      }
      return undefined;
   }

   const stack = {
      push,
      pop,
      // getCurrentNode(context: ContextSnapshot | undefined){
      //    return context?.[name]
      // }
   }

   asyncContextStack.stacks[name] = stack

   return [
      function getCurrentState(context = getCurrentContext()) {
         if (!context) return;
         return context[name]?.value
      },
      stack
   ] as const;
}


export function $_run_with_(context: ContextSnapshot, fn: Function, obj?: AnyObject) {
   const stacks = obj ? [] as Stack[] : undefined
   try {
      asyncContextStack.push(context);
      if (stacks && obj) {
         for (const key in obj) {
            const stack = asyncContextStack.stacks[key]
            if (!stack) continue;
            stack.push(obj[key], context)
            stacks.push(stack)
         }
      }
      return fn();
   } finally {
      if (stacks)
         for (const stack of stacks) {
            stack.pop(context)
         }
      asyncContextStack.pop()
   }
}

export function $_wrap_with_context(fn: Function) {
   const context = $_snap_context()
   return (...args: any[]) => {
      $_run_with_(context, () => fn(...args))
   }
}



//API

