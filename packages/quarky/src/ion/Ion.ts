import { isFunction } from "@rue/utils";
import { Inert } from "./Get";
import { AtomicIonQuark, createAtomicIon } from "./AtomicIon";
import { AnyObject } from "@rue/types";
import { initializeSnapshots } from "../ionic/x_TimeTraveler";
import { QUARK } from "../abstract/Quark";
import { isGetter } from "../reactivity/Substance";
import { createMemoizedDerivation } from "./DerivationIon";
import { SimpleState } from "../reactivity/State";
import { createHybridIon } from "./HybridIon";
import { AsyncIon, AsyncProps } from "../async/AsyncIon";

/* API */
export type Ion<T = unknown> = (() => T) /* & { '~ion': true } */

// type MaybeInert<T = unknown> = IsIonic<ExcludePrimitives<T>> extends true ? T : IsInert<ExcludePrimitives<T>> extends true ? T : T extends object ? Inert<ExcludePrimitives<T>> | OnlyPrimitives<T> : T

export type MutableIon<T> = Ion<T> & { value: T }


// NOTE: deprecating NonVoid because extending generic as NonVoid causes type-narrowing
// export type NonVoid = string | number | object | undefined | boolean | bigint | symbol | null

type Derivation<R = unknown> = (prevValue?: R) => R

export type Methods = AnyObject
// { [key: PropertyKey]: (...args: any) => any }

type PickMethods = (...args: string[]) => ReinConfig

type ReinConfig = { capsule: AnyObject, selectedMethods: string[] }


type IonOptions<T, M> = M extends { '-fetch': any } ? { '-fetch': () => Promise<T> | T } : {}

export const asIon = Ion

/**
 * Creates an ion, ion capsule, or derivation ion, depending on parameters.
 * 
 * ##### ION:
 * ```
 * const $count = Ion(0)
 * ```
 * 
 * ##### ION CAPSULE:
 * ```
 * const $count = Ion(0, {
 *    increment() {
 *       this.count++
 *    },
 *    decrement() {
 *       this.count--
 *    }
 * })
 * ```
 * 
 * ##### DERIVATION ION:
 * 
 * ```
 * const $doubleCount = Ion(() =>$count() * 2)
 * ```
 * 
 * 
 * // TODO: what should happen when you pass an ion as the initial state?
 * 
 * @param initialState or pure getter for derivations
 * @param methods optional
 * @returns `Ion<T>`
 */

export function Ion<
   T,
   M
>(initialState: T & (() => unknown), props?: M & ThisType<IonMethods<M>>): AsIon<T, M>
export function Ion<
   T,
   M
>(initialState: T, props?: M & ThisType<IonMethods<M> & { value: T }> & IonOptions<T, M>): AsIon<T, M>
export function Ion<
   T,
   M
>(initialState: T & (() => unknown) | T, props?: M & ThisType<IonMethods<M> & { value: T }> & IonOptions<T, M>): AsIon<T, M> {
   return _asIon(initialState, props) as AsIon<T, M>
}

export function isIon(value: unknown): value is Ion {
   return isFunction(value) &&
      // value.length === 0
      QUARK in value
   // /^\$[a-z]/.test(value.name) && 
   // value.length === 0
}

export function $_derivation(fn: () => unknown) {
   //@ts-expect-error
   fn[QUARK] = { inert: false };
   //@ts-expect-error
   fn.displayName = 'getState'
   return fn
}

//@ts-expect-error
window.$_derivation = $_derivation;

//@ts-expect-error
window.$_value = $_value;

function $_value(value: any) {
   return $_is_ref(value) ? value() : value;
}

//@ts-expect-error
window.$_is_mutable = $_is_mutable;

function $_is_mutable(value: Function) {
   return 'value' in value
}

//@ts-expect-error
window.$_is_ref = $_is_ref;

function $_is_ref(value: AnyObject) {
   return isFunction(value) &&
      //@ts-expect-error
      value.displayName === 'getState'
}

export function toIon<T>(value: T): T extends Ion ? T : Ion<T> {
   return (isGetter(value) ? value : Inert(value)) as T extends Ion ? T : Ion<T>
}



export function toValue<T>(maybeFn: T): T extends () => infer R ? R : T {
   return isFunction(maybeFn) && maybeFn.length === 0 ? maybeFn() : maybeFn as T extends () => infer R ? R : T;
}

type OptionKeys = '-writable' | '-fetch' | '-refetch' | '-watch' | '-derive'

type IonMethods<M> = { [K in keyof M as K extends OptionKeys ? never : K]: M[K] }

type AsIon<T, M = {}> = [T] extends [MutableIon<unknown>]
   ? T // [T] extends [AtomicIon] to prevent type-narrowing
   : [T] extends [Derivation<infer R>]
   ? M extends { '-writable': true }
   ? MutableIon<R> & { [K in keyof M as K extends OptionKeys ? never : K]: M[K] }
   : Ion<R> & { [K in keyof M as K extends OptionKeys ? never : K]: M[K] }
   : M extends { '-fetch': any } | { '-refetch': any }
   ? Ion<T> & { [K in keyof M as K extends OptionKeys ? never : K]: M[K] } & {
      pending: Promise<T> | null;
      loaded: boolean;
   }
   : MutableIon<T> & { [K in keyof M as K extends OptionKeys ? never : K]: M[K] }




// export const makeIon = ion
// export const createIon = ion

// Ion.Ionized = createIonizedIon
// makeIon.Ionized = createIonizedIon
// createIon.Ionized = createIonizedIon

// function createIonizedIon<
//    T extends Record<string, unknown>,
//    M
// >(initialStateDefinition: T, methods: M & Methods): AsMutableIon<T, M> {
//    return asIon(initialStateDefinition, MUTABLE, IONIZED, methods) as AsMutableIon<T, M>
// }

// type State<D> = [D] extends [StateDef<infer T>] ? T : D

// ion.Ionized = createIonizedIon
// ion.ionize = createIonizedIon
// ion.mu = createMutableIon
// createMutableIon.ionize = createMutableIonizedIon
// createMutableIonizedIon.mu = createDeepMutableIonizedIon


// function createIonizedIon<
//    T,
//    M
// >(initialState: T, options?: IonizeOptions & { set?: Function, get?: Function }): AsIon<Ionized<ExcludePrimitives<T>> | OnlyPrimitives<T>, M> { // TODO: inert marks
//    return asIon(initialState, IONIZED, options) as AsIon<Ionized<ExcludePrimitives<T>> | OnlyPrimitives<T>, M> // TODO: add inert marks
// }




export function defineIon<T, A, P, O>(constructor: (...args: A & any[]) => T, proto?: P & ThisType<P & { value: T }> & { '~pure'?: () => (keyof P)[] }, protoOptions?: { pure: string }) {
   return (...args: A & any) => Ion(constructor(...args), proto) as MutableIon<T> & P
}

// TODO: Optimization: Use compiler to presort different types of ions
function _asIon(
   initialState: unknown | (() => unknown),
   props?: AnyObject,
) {
   if (isFunction(initialState)) {
      if (props && '-writable' in props) {
         const watch = props['-watch']
         delete props['-writable']
         delete props['-watch']
         return createHybridIon({ derive: initialState, watch }, props)
      }
      return initializeSnapshots(createMemoizedDerivation(<Derivation>initialState, props))
   }

   if (isIon(initialState)) {
      return initialState
   }
   if (props && '-derive' in props) {
      const derive = props['-derive']
      const watch = props['-watch']
      delete props['-derive']
      delete props['-watch']
      return createHybridIon({ derive, initial: initialState, watch }, props)
   }
   if (props && '-fetch' in props) {
      const fetch = props['-fetch']
      const watch = props['-watch'] // TODO:
      delete props['-fetch']
      delete props['-watch']
      return AsyncIon(initialState, fetch, props)
   }
   return initializeSnapshots(createAtomicIon(new AtomicIonQuark(new SimpleState(initialState), props), props)) // TODO: add inert mark map
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


// const $count = Ion(0)

// const $doublecount = Ion(() =>{if (isIon($count)) return $count() * 2}, {
//    doSomething(){}
// })

// const $countB = Ion((prev?: number) => (prev ?? 0) + 2)

// const $active = Ion('frog', {
//    toggle() {

//    }
// })

// const $actived = Ion(false, {
//    toggler() { }
// })

// $actived.value = true

// function som<T>(value: T): T {
//    return null as T;
// }

// som(true)
