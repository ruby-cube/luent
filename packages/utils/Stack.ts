interface StackNode<T> {
   value: T;
   prev: StackNode<T> | undefined;
}

type Push<T> = (value: T) => void
type Pop = () => void
type GetCurrent<T> = () => T | undefined

export function createStack<T>(): [Push<T>, Pop, GetCurrent<T>] {
   let stack: StackNode<T> | undefined = undefined


   function push(value: T) {
      stack = { value: value, prev: stack }
   }

   function pop() {
      if (stack) stack = stack.prev
   }

   function getCurrent() {
      return stack?.value
   }

   return [push, pop, getCurrent]
}
