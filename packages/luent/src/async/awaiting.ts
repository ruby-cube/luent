export function awaiting<T>(promise: Promise<T>, onFulfilled: (<TResult1 = T>(value: T) => TResult1 | PromiseLike<TResult1> | void) | undefined | null) {
  return promise.then(onFulfilled) // TODO: wrap with async context
}
