export function UseShared<T, P extends any[]>(factory: (...args: P) => T) {
   let shared: T;
   return (...args: P) => shared ?? (shared = factory(...args))
}