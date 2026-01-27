
// declare type PromiseConstructorLike = new <T>(executor: (resolve: (value: T | Promise<T>) => void, reject: (reason?: any) => void) => void) => Promise<T>;

import { resolve } from "path"
import { QUARK } from "../../../quarky/src/abstract/Quark"
import { AnyObject } from "@rue/types"
import { isFunction, isObjectLiteral } from "@rue/utils"

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

export const ooo = {
   await<T, O extends object>(awaited: T, onFulfilled?: (value: T) => O | void) {

      const promise = toPromise(isFunction(awaited) ? awaited() : awaited) as Promise<any> // TODO: Function and Array cases and value (Promise.resolve())

      return new AsyncNode(
         onFulfilled ? promise.then(onFulfilled) : promise,
         onFulfilled ? () => ({}) : undefined
      )
   }
}

function toPromise(awaited: any) {
   if (awaited instanceof Promise) return awaited
   else if (awaited instanceof Array) return Promise.all(awaited)
   else return Promise.resolve(awaited)
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


const INTERNAL = Symbol('internal')


/**
 * Represents the completion of an asynchronous operation
 */
class AsyncNode<C> {

   private [INTERNAL] = {
      promise: undefined as any as Promise<any>,
      $context: undefined as (() => object) | undefined,
      /**
       * Converts AsyncNode into promise
       * @returns Promise<any>
       */
      start() {
         return new Promise((resolve, reject) => {
            this.promise.then(resolve).catch(reject)
         })
      }
   }

   constructor(
      promise: Promise<C>,
      $context: (() => object) | undefined
   ) {
      this[INTERNAL].promise = promise
      this[INTERNAL].$context = $context
   }

   await<T, Res, Rej>(awaited: (context: C) => (PromiseLike<any> | any)[] | PromiseLike<T> | T, onFulfilled?: ((value: T, context: C) => Res | Promise<Res>) | undefined | null, options?: { catch?: ((reason: any, context: C) => Rej | Promise<Rej>) | undefined | null, finally?: (context: C) => void }): AsyncNode<Res | Rej> {
      const $context = this[INTERNAL].$context
      let context: any;
      const promise = this[INTERNAL].promise.then(value => toPromise(awaited($context ? (context = { ...$context(), ...value ?? {} }) : value)))

      return new AsyncNode(onFulfilled ? promise.then(value => {
         const output = onFulfilled(value, context)
         if (isObjectLiteral(output) && $context) context = { ...$context(), ...output }
         return output
      }) : promise, () => context)

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
   catch<TResult = never>(task?: ((reason: any, context?: AnyObject) => TResult | Promise<TResult>) | undefined | null): AsyncNode<C | TResult> {

      // this.oo
      //    //@ts-expect-error: private property
      //    .series
      //    .push({
      //       type: 'catch',
      //       awaited: undefined,
      //       task: onrejected,
      //       options: undefined
      //    })
      // return new AsyncNode(this.oo)
      return new AsyncNode(
         this[INTERNAL].promise.catch(error => task?.(error, this[INTERNAL].$context?.())),
         this[INTERNAL].$context
      )
   }

   finally(task?: ((context?: AnyObject) => void) | undefined | null): AsyncNode<C> {
      // this.oo
      //    //@ts-expect-error: private property
      //    .series
      //    .push({
      //       type: 'finally',
      //       awaited: undefined,
      //       task: onSettled,
      //       options: undefined
      //    })
      return new AsyncNode(
         this[INTERNAL].promise.finally(() => task?.(this[INTERNAL].$context?.())),
         this[INTERNAL].$context
      )
   }
}



export function Async<F extends (...args: any[]) => AsyncNode<any>>(fn: F): ReturnType<F> extends AsyncNode<infer T> ? (...args: Parameters<F>) => Promise<T> : never {

   function asyncFn(...args: any[]) {
      return fn(...args)[INTERNAL].start()
   }

   return asyncFn as ReturnType<F> extends AsyncNode<infer T> ? (...args: Parameters<F>) => Promise<T> : never
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


