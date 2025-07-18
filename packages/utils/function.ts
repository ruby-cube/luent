export function __DEV__unwrap(fn: { __DEV__fn: Function } | {}) {
   if ('__DEV__fn' in fn) {
      return __DEV__unwrap(fn.__DEV__fn)
   }
   return fn;
}