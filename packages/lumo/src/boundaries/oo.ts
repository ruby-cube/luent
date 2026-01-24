
// declare type PromiseConstructorLike = new <T>(executor: (resolve: (value: T | Promise<T>) => void, reject: (reason?: any) => void) => void) => Promise<T>;

import { resolve } from "path"

// interface Promise<T> {
//    /**
//     * Attaches callbacks for the resolution and/or rejection of the Promise.
//     * @param onfulfilled The callback to execute when the Promise is resolved.
//     * @param onrejected The callback to execute when the Promise is rejected.
//     * @returns A Promise for the completion of which ever callback is executed.
//     */
//    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | Promise<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | Promise<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
// }

// finally(onfinally?: (() => void) | undefined | null): Promise<T>;


export let oo: AsyncSeries = {} as AsyncSeries
// function doSomething() { }
// const db = { fetchSomething() { } }
// function fetchSomething() {
//    return new Promise<string>(res => { })
// }

// oo.await(fetchSomething, () => {
//    doSomething()
// }, {
//    catch: error => { },
//    finally: () => { }
// })
//    .await(() => db.fetchSomething(), () => {
//       return doSomething()
//    })
//    .then(value => {

//    })


type ThenOptions = { catch?: ((reason: any) => unknown | Promise<unknown>) | undefined | null, finally?: () => void }

type AwaitKit = {
   type: 'await' | 'then' | 'catch' | 'finally'
   awaited?: () => Promise<unknown> | unknown
   task?: ((value: any) => any) | null
   options?: ThenOptions
}

class AsyncSeries {

   private series: AwaitKit[] = []

   private start() {
      return new Promise((resolve, reject) => {
         let i = 0;

         const setUpNext = (output: unknown, next: AwaitKit) => {
            if (next.type === 'then') {
               if (!next.task) throw new Error('Inconceivable!')
               setUpTask(output, next.task!, next.options, this.series[++i])
            }
            else if (next.type === 'await') {
               if (!next.awaited) throw new Error('Inconceivable!')
               if (output instanceof Promise) {
                  // QUESTION: Promise.all vs Promise.allSettled?
                  handleAwaited(Promise.all([output, next.awaited()]), output, next.task, next.options, this.series[++i])
               }
               else {
                  handleAwaited(next.awaited(), output, next.task, next.options, this.series[++i])
               }
            }
            // else if (next.type === 'catch') {

            // }
            // else if (next.type === 'finally') {

            // }
         }

         const handleOptions = (options: ThenOptions, maybePromise: unknown) => {
            if (maybePromise instanceof Promise) {
               const promise = options.catch ? maybePromise.catch(options.catch) : maybePromise
               return options.finally ? promise.finally(options.finally) : promise
            }
            return maybePromise
         }

         const handleAwaited = (maybePromise: unknown, piped: unknown, task: ((value: unknown) => unknown) | undefined | null, options: ThenOptions | undefined, next: AwaitKit | undefined) => {
            if (task) {
               setUpTask(maybePromise, piped === INITIAL ? task : piped instanceof Promise ? ([piped, res]) => task({res, piped}) : (res) => task({res, piped}), options, next)
            }
            else {
               if (next) {
                  setUpNext(options ? handleOptions(options, maybePromise) : maybePromise, next)
               }
               else {
                  handleOutput(maybePromise, resolve, options)
               }
            }
         }

         const setUpTask = (output: unknown, task: (value: any) => unknown, options: ThenOptions | undefined, next: AwaitKit | undefined) => {
            handleOutput(output, (value: unknown) => {
               const output = task(value)
               if (next) {
                  setUpNext(output, next)
               }
               else {
                  handleOutput(output, resolve)
               }
            }, options)
         }

         const handleOutput = (output: unknown, task: (value: unknown) => void, options?: ThenOptions | undefined) => {
            if (output instanceof Promise) {
               if (options?.finally) {
                  output
                     .then( task, options?.catch)
                     .finally(options.finally)
               }
               else {
                  output.then(task, options?.catch)
               }
            }
            else {
               task(output)
               if (options?.finally) {
                  options.finally()
               }
            }
         }

         const kit = this.series[0]
         const INITIAL = Symbol('initial')

         handleAwaited(kit.awaited!(), INITIAL, kit.task, kit.options, this.series[++i])
      })
   }


   await<T, Res, Rej>(awaited: () => Promise<T> | T, onFulfilled?: ((value: T) => Res | Promise<Res>) | undefined | null, options?: { catch?: ((reason: any) => Rej | Promise<Rej>) | undefined | null, finally?: () => void }): AwaitNode<Res | Rej> {
      this.series.push({
         type: 'await',
         awaited,
         task: onFulfilled,
         options
      })
      return new AwaitNode(this)
   }
}





/**
 * Represents the completion of an asynchronous operation
 */
class AwaitNode<P> {

   constructor(
      private oo: AsyncSeries
   ) {
   }

   await<T, Res, Rej>(awaited: () => Promise<T> | T, onFulfilled?: ((value: { res: T, piped: P }) => Res | Promise<Res>) | undefined | null, options?: { catch?: ((reason: any) => Rej | Promise<Rej>) | undefined | null, finally?: () => void }): AwaitNode<Res | Rej> {
      this.oo
         //@ts-expect-error: private property
         .series
         .push({
            type: 'await',
            awaited,
            task: onFulfilled,
            options
         })
      return new AwaitNode(this.oo)
   }

   /**
    * Attaches callbacks for the resolution and/or rejection of the Promise.
    * @param onfulfilled The callback to execute when the Promise is resolved.
    * @returns A Promise for the completion of which ever callback is executed.
    */
   then<Res = P, Rej = never>(onFulfilled?: ((value: P) => Res | Promise<Res>) | undefined | null, options?: { catch?: ((reason: any) => Rej | Promise<Rej>) | undefined | null, finally?: () => void }): AwaitNode<Res | Rej> {
      this.oo
         //@ts-expect-error: private property
         .series
         .push({
            type: 'then',
            awaited: undefined,
            task: onFulfilled,
            options
         })
      return new AwaitNode(this.oo)
   }

   /**
    * Attaches a callback for only the rejection of the Promise.
    * @param onrejected The callback to execute when the Promise is rejected.
    * @returns A Promise for the completion of the callback.
    */
   catch<TResult = never>(onrejected?: ((reason: any) => TResult | Promise<TResult>) | undefined | null): AwaitNode<P | TResult> {
      this.oo
         //@ts-expect-error: private property
         .series
         .push({
            type: 'catch',
            awaited: undefined,
            task: onrejected,
            options: undefined
         })
      return new AwaitNode(this.oo)
   }

   finally(onSettled?: (() => void) | undefined | null): AwaitNode<P> {
      this.oo
         //@ts-expect-error: private property
         .series
         .push({
            type: 'finally',
            awaited: undefined,
            task: onSettled,
            options: undefined
         })
      return new AwaitNode(this.oo)
   }
}



export function Async<F extends (...args: any[]) => any>(fn: F): (...args: Parameters<F>) => ReturnType<F> extends AwaitNode<infer T> ? Promise<T> : never {

   function asyncFn(...args: any[]) {
      const asyncSeries = oo = new AsyncSeries()
      fn(...args)
      oo = {} as AsyncSeries
      // @ts-expect-error: private property
      return asyncSeries.start()
   }

   return asyncFn as F
}












/**
 * Recursively unwraps the "awaited type" of a type. Non-promise "thenables" should resolve to `never`. This emulates the behavior of `await`.
 */
type _Awaited<T> = T extends null | undefined ? T : // special case for `null | undefined` when not in `--strictNullChecks` mode
   T extends object & { then(onfulfilled: infer F, ...args: infer _): any; } ? // `await` only unwraps object types with a callable `then`. Non-object types are not unwrapped
   F extends ((value: infer V, ...args: infer _) => any) ? // if the argument to `then` is callable, extracts the first argument
   Awaited<V> : // recursively unwrap the value
   never : // the argument to `then` was not callable
   T; // non-object or non-thenable


