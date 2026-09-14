import { $_wrap_with_context } from "@luent/flask";
import { Ion } from "@luent/quarky";
import { isFunction } from "@luent/utils";

export function awaiting<T>(promise: Promise<T> | Ion<T> & { pending: Promise<T> | null }, onFulfilled?: (<TResult1 = any>(value: T) => TResult1 | PromiseLike<TResult1> | void) | undefined | null) {
  const _promise = isFunction(promise) && 'pending' in promise ? promise.pending : promise
  if (_promise === null) return (promise as Ion<any>)() 
  if (onFulfilled)
    return _promise.then($_wrap_with_context(onFulfilled)) // TODO: wrap with async context
  return _promise;
}
