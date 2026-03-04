
// declare type PromiseConstructorLike = new <T>(executor: (resolve: (value: T | Promise<T>) => void, reject: (reason?: any) => void) => void) => Promise<T>;

import { isFunction, isPlainObject } from "@rue/utils"
import { instantUpdate } from "../reactivity/Update"
import { Ion } from "../ion/Ion"
import { $_snap_context } from "@rue/flask"

// TODO:
// [ ] wrap with context
// [ ] contain in flask
// [ ] how does flask relate to cancelling or aborting?

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


// export let oo: AsyncSeries = {} as AsyncSeries
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

// function wrap(onFulfilled: (value: unknown) => unknown, series: AsyncSeries) {
//    return (value: unknown) => {
//       if (series.cancelled) return;
//       return onFulfilled(value)
//    }
// }

export type Resolved<T> = T extends PromiseLike<infer V> ? V : T extends () => PromiseLike<infer V> ? V : unknown


export const ooo = {
   await<T, F>(awaited: T, onFulfilled?: F & ((value: Resolved<T>) => any)) {

      const promise = toPromise(
         awaited instanceof Object && 'asPromise' in awaited
            ? awaited.asPromise
            : isFunction(awaited)
               ? awaited()
               : awaited
      ) as Promise<any> // TODO: Function and Array cases and value (Promise.resolve())

      const series = {
         cancelled: false,
         cancel() {
            this.cancelled = true
         }
      }

      let output: any;

      const context = $_snap_context()


      return new AsyncNode<F extends (...args: any[]) => infer R ? R : Resolved<T>>(
         series,
         promise.then((value: Resolved<T>) => {
            if (series.cancelled) return;
            return output = onFulfilled ? instantUpdate(() => onFulfilled(value)) : value
         }),
         () => output
      )
   }
}

function toPromise(awaited: any) {
   if (awaited instanceof Promise) return awaited
   if (awaited instanceof Object && 'asPromise' in awaited) return awaited.asPromise
   else if (awaited instanceof Array) return Promise.all(toPromises(awaited))
   else return Promise.resolve(awaited)
}

function toPromises(awaited: any[]) {
   return awaited.map((awaited) => 'asPromise' in awaited ? awaited.asPromise : awaited)
}

// class AsyncSeries {

//    private series: AwaitKit[] = []

//    private start() {
//       return new Promise((resolve, reject) => {
//          let i = 0;

//          const setUpNext = (output: unknown, next: AwaitKit) => {
//             if (next.type === 'then') {
//                if (!next.task) throw new Error('Inconceivable!')
//                setUpTask(output, next.task!, next.options, this.series[++i])
//             }
//             else if (next.type === 'await') {
//                if (!next.awaited) throw new Error('Inconceivable!')
//                if (output instanceof Promise) {
//                   // QUESTION: Promise.all vs Promise.allSettled?
//                   handleAwaited(Promise.all([output, next.awaited()]), output, next.task, next.options, this.series[++i])
//                }
//                else {
//                   handleAwaited(next.awaited(), output, next.task, next.options, this.series[++i])
//                }
//             }
//             // else if (next.type === 'catch') {

//             // }
//             // else if (next.type === 'finally') {

//             // }
//          }

//          const handleOptions = (options: ThenOptions, maybePromise: unknown) => {
//             if (maybePromise instanceof Promise) {
//                const promise = options.catch ? maybePromise.catch(options.catch) : maybePromise
//                return options.finally ? promise.finally(options.finally) : promise
//             }
//             return maybePromise
//          }

//          const handleAwaited = (maybePromise: unknown, piped: unknown, task: ((value: unknown) => unknown) | undefined | null, options: ThenOptions | undefined, next: AwaitKit | undefined) => {
//             if (task) {
//                setUpTask(maybePromise, piped === INITIAL ? task : piped instanceof Promise ? ([piped, res]) => task({ res, piped }) : (res) => task({ res, piped }), options, next)
//             }
//             else {
//                if (next) {
//                   setUpNext(options ? handleOptions(options, maybePromise) : maybePromise, next)
//                }
//                else {
//                   handleOutput(maybePromise, resolve, options)
//                }
//             }
//          }

//          const setUpTask = (output: unknown, task: (value: any) => unknown, options: ThenOptions | undefined, next: AwaitKit | undefined) => {
//             handleOutput(output, (value: unknown) => {
//                const output = task(value)
//                if (next) {
//                   setUpNext(output, next)
//                }
//                else {
//                   handleOutput(output, resolve)
//                }
//             }, options)
//          }

//          const handleOutput = (output: unknown, task: (value: unknown) => void, options?: ThenOptions | undefined) => {
//             if (output instanceof Promise) {
//                if (options?.finally) {
//                   output
//                      .then(task, options?.catch)
//                      .finally(options.finally)
//                }
//                else {
//                   output.then(task, options?.catch)
//                }
//             }
//             else {
//                task(output)
//                if (options?.finally) {
//                   options.finally()
//                }
//             }
//          }

//          const kit = this.series[0]
//          const INITIAL = Symbol('initial')

//          handleAwaited(kit.awaited!(), INITIAL, kit.task, kit.options, this.series[++i])
//       })
//    }


//    await<T, Res, Rej>(awaited: () => Promise<T> | T, onFulfilled?: ((value: T) => Res | Promise<Res>) | undefined | null, options?: { catch?: ((reason: any) => Rej | Promise<Rej>) | undefined | null, finally?: () => void }): AsyncNode<Res | Rej> {
//       this.series.push({
//          type: 'await',
//          awaited,
//          task: onFulfilled,
//          options
//       })
//       return new AsyncNode(this)
//    }
// }


export const INTERNAL = Symbol('internal')

export type AsyncSeries = {
   cancelled: boolean
   cancel(): void
}

/**
 * Represents the completion of an asynchronous operation
 */
export class AsyncNode<P> {

   private [INTERNAL] = {
      series: undefined as any as AsyncSeries,
      $piped: undefined as any as () => any,
      cancel() {
         this.series.cancel()
      }
   }

   constructor(
      series: AsyncSeries,
      promise: Promise<any>,
      $piped: () => any
   ) {
      this[INTERNAL].series = series
      this.asPromise = promise // previous promise
      this[INTERNAL].$piped = $piped
   }

   asPromise!: Promise<P>

   await<T, F>(awaited: (piped: P) => T, onFulfilled?: F & ((value: T, piped: P) => any)) {
      const { $piped, series } = this[INTERNAL]
      const promise = this.asPromise.then(value => {
         if (series.cancelled) return;
         return toPromise(awaited($piped()))
      })

      let output: any;
      return new AsyncNode<F extends (...args: any[]) => infer R ? R : Resolved<T>>(
         series,
         promise.then(value => {
            if (series.cancelled) return;
            return output = onFulfilled ? instantUpdate(() => onFulfilled(value, $piped())) : value
         }),
         () => output
      )

      // this.oo
      //    //@ts-expect-error: private property
      //    .series
      //    .push({
      //       type: 'await',
      //       awaited,
      //       task: onFulfilled,
      //       options
      //    })
      // return new AsyncNode(this.oo)


   }

   // /**
   //  * Attaches callbacks for the resolution and/or rejection of the Promise.
   //  * @param onfulfilled The callback to execute when the Promise is resolved.
   //  * @returns A Promise for the completion of which ever callback is executed.
   //  */
   // then<Res = P, Rej = never>(onFulfilled?: ((value: P) => Res | Promise<Res>) | undefined | null, options?: { catch?: ((reason: any) => Rej | Promise<Rej>) | undefined | null, finally?: () => void }): AsyncNode<Res | Rej> {
   //    this.oo
   //       //@ts-expect-error: private property
   //       .series
   //       .push({
   //          type: 'then',
   //          awaited: undefined,
   //          task: onFulfilled,
   //          options
   //       })
   //    return new AsyncNode(this.oo)
   // }

   /**
    * Attaches a callback for only the rejection of the Promise.
    * @param onrejected The callback to execute when the Promise is rejected.
    * @returns A Promise for the completion of the callback.
    */
   catch<TResult = never>(task?: ((reason: any, piped: P) => TResult) | undefined | null) {
      const { $piped, series } = this[INTERNAL]

      let output: TResult;
      return new AsyncNode<P | TResult>(
         series,
         task
            ? this.asPromise.catch(error => series.cancelled || (output = instantUpdate(() => task(error, $piped()))))
            : this.asPromise,
         () => output
      )
   }

   finally(task?: ((piped: P) => void) | undefined | null): AsyncNode<P> {
      const { $piped, series } = this[INTERNAL]

      return new AsyncNode(
         series,
         task
            ? this.asPromise.finally(() => series.cancelled || instantUpdate(() => task($piped())))
            : this.asPromise,
         $piped
      )
   }
}



export function Async<F extends (...args: any[]) => AsyncNode<any>>(fn: F): ReturnType<F> extends AsyncNode<infer T> ? (...args: Parameters<F>) => Promise<T> : never {

   function asyncFn(...args: any[]) {
      return fn(...args).asPromise
   }

   return asyncFn as ReturnType<F> extends AsyncNode<infer T> ? (...args: Parameters<F>) => Promise<T> : never
}

// for AsyncIon shorthand
export const o = {
   await<T, F>(awaited: T, onFulfilled?: F & ((value: Resolved<T>) => any)): Ion<Resolved<T>> {
      // @ts-expect-error: compiler transforms this call into an AsyncIon
      return ooo.await(awaited, onFulfilled)
   }
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


