import { isFunction, isObject } from "@luent/utils";
import { createAtomicIon } from "./AtomicIon";
import { createMemoizedDerivation } from "./DerivationIon";
import { createHybridIon } from "./HybridIon";
import { AnyObject } from "@luent/types";
import { $Async, AsyncIon, createAsyncIon } from "../async/AsyncIon";
import { isIon } from "./utils";
import { ionic } from "../ionic/Ionic";

/* API */
export interface Ion<T = unknown> {
  (): T
  value?: T
  '~ion'?: true
}

// type MaybeInert<T = unknown> = IsIonic<ExcludePrimitives<T>> extends true ? T : IsInert<ExcludePrimitives<T>> extends true ? T : T extends object ? Inert<ExcludePrimitives<T>> | OnlyPrimitives<T> : T

export interface MutableIon<T> extends Ion<T> {
  value: T
}


// NOTE: deprecating NonVoid because extending generic as NonVoid causes type-narrowing
// export type NonVoid = string | number | object | undefined | boolean | bigint | symbol | null

type Derivation<R = unknown> = (previous?: R) => R

type IonOptions<T, M> = M extends { '-fetch': any } 
? { '-fetch': (oo: (fn: () => any) => any) => Promise<T> | T } 
: {}


/**
 * Creates an ion, ion capsule, derivation ion, or async ion, depending on parameters. 
 * If an ion is passed in with no additional setup, the same ion will be returned
 * 
 * ---
 * ##### ION:
 * ```
 * const count = ion(0)
 * 
 * ```
 * ---
 * 
 * ##### ION CAPSULE:
 * ```
 * const count = ion(0, {
 *    increment() {
 *       this.value++
 *    },
 *    decrement() {
 *       this.value--
 *    }
 * })
 * 
 * ```
 * ---
 * ##### DERIVATION ION:
 * 
 * ```
 * const doubleCount = ion(() => count() * 2)
 * 
 * ```
 * ---
 * @param initialState or side-effect-free accessor functions for derivations
 * @param methods optional
 * @returns `Ion<T>`
 */

export function ion<
  T,
  M
>(initialState: T & (() => unknown), setup?: M & ThisType<IonMethods<M>>): AsIon<T, M>
export function ion<
  T,
  M
>(initialState: T, setup?: M & ThisType<IonMethods<M> & { value: T }> & IonOptions<T, M>): AsIon<T, M>
export function ion<
  T,
  M
>(initialState: T & (() => unknown) | T, setup?: M & ThisType<IonMethods<M> & { value: T }> & IonOptions<T, M>): AsIon<T, M> {
  return asIon(initialState, setup) as AsIon<T, M>
}

export function ionize<T extends AnyObject, M>(target: T, setup?: M & ThisType<IonMethods<M> & { value: T }> & IonOptions<T, M>) {
  return ion(ionic(target), setup)
}


type OptionFlags = '-mutable' | '-fetch' | '-refetch' | '-track' | '-derive'

type IonMethods<M> = { [K in keyof M as K extends OptionFlags ? never : K]: M[K] }

type AsIon<T, M = {}> = [T] extends [MutableIon<unknown>]
  ? T // [T] extends [AtomicIon] to prevent type-narrowing
  : [T] extends [Derivation<infer R>]
  ? M extends { '-mutable': boolean } // TODO: distinguish true vs false without requiring devs to write { '-mutable': true as const}
  ? MutableIon<R> & { [K in keyof M as K extends OptionFlags ? never : K]: M[K] }
  : M extends { '@set': Function }
  ? MutableIon<R> & { [K in keyof M as K extends OptionFlags ? never : K]: M[K] }
  : Ion<R> & { [K in keyof M as K extends OptionFlags ? never : K]: M[K] }
  : M extends { '-fetch': any } | { '-refetch': any }
  ? Ion<T> & { [K in keyof M as K extends OptionFlags ? never : K]: M[K] } & $Async<T>
  : MutableIon<T> & { [K in keyof M as K extends OptionFlags ? never : K]: M[K] }



// TODO: Optimization: Use compiler to presort different types of ions
function asIon(
  initialState: unknown | (() => unknown),
  setup?: AnyObject,
) {
  if (isIon(initialState) && !setup) {
    return initialState
  }

  if (isFunction(initialState)) {
    if (setup && '-mutable' in setup) {
      const observe = setup['-track']
      delete setup['-mutable']
      delete setup['-track']
      return createHybridIon({ derive: initialState, observe }, setup)
    }
    return createMemoizedDerivation(<Derivation>initialState, setup)
  }

  if (setup && '-derive' in setup) {
    const derive = setup['-derive']
    const observe = setup['-track']
    delete setup['-derive']
    delete setup['-track']
    return createHybridIon({ derive, initial: initialState, observe }, setup)
  }
  if (setup && '-fetch' in setup) {
    const fetch = setup['-fetch']
    delete setup['-fetch']
    // return AsyncIon(initialState, fetch, setup)
    return createAsyncIon({ initialState, fetch, wrap: setup['-as'], awaited: setup['-awaited'] })
  }
  return createAtomicIon(initialState, setup)
}



// isIon // any sort of ion
// isAtomic // primary
// isInertIon // known inert
// isMemoized // memoized derivation
// isWritable
// isCapsule
// isAtomicPion
// isAbsorbedIon
// isIonized
// isReactive
// isReadonly
// isReined


// const $count = ion(0)

// const $doublecount = ion(() =>{if (isIon($count)) return $count() * 2}, {
//    doSomething(){}
// })

// const $countB = ion((prev?: number) => (prev ?? 0) + 2)

// const $active = ion('frog', {
//    toggle() {

//    }
// })

// const $actived = ion(false, {
//    toggler() { }
// })

// $actived.value = true

// function som<T>(value: T): T {
//    return null as T;
// }

// som(true)
