interface Stack<T> {
   value: T;
   prev: Stack<T> | undefined;
}

let stack: Stack<number> | undefined = {
   value: 0,
   prev: undefined
}

function pushValue(value: number) {
   stack = { value: value, prev: stack }
}

function popValue() {
   if (stack) stack = stack.prev
}