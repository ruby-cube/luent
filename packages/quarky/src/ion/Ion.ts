import { isFunction } from "@rue/utils";
import { Inert } from "./Get";
import { AtomicIonQuark, createAtomicIon } from "./AtomicIon";
import { AnyObject } from "@rue/types";
import { initializeSnapshots } from "../ionic/x_TimeTraveler";
import { QUARK } from "../abstract/Quark";
import { isGetter } from "../reactivity/Substance";
import { createMemoizedDerivation } from "./DerivationIon";
import { SimpleState } from "../reactivity/State";

/* API */
export type Ion<T = unknown> = (() => T) & { '~ion': true }

// type MaybeInert<T = unknown> = IsIonized<ExcludePrimitives<T>> extends true ? T : IsInert<ExcludePrimitives<T>> extends true ? T : T extends object ? Inert<ExcludePrimitives<T>> | OnlyPrimitives<T> : T

export type MutableIon<T> = Ion<T> & { value: T }


// NOTE: deprecating NonVoid because extending generic as NonVoid causes type-narrowing
// export type NonVoid = string | number | object | undefined | boolean | bigint | symbol | null

type Derivation<R = unknown> = (prevValue?: R) => R

export type Methods = AnyObject
// { [key: PropertyKey]: (...args: any) => any }

type PickMethods = (...args: string[]) => ReinConfig

type ReinConfig = { capsule: AnyObject, selectedMethods: string[] }

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


type AsIon<T, M = {}> = [T] extends [MutableIon<unknown>] ? T // [T] extends [AtomicIon] to prevent type-narrowing
   : [T] extends [Derivation<infer R>] ? Ion<R> & M
   : MutableIon<T> & M



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
>(initialState: T & (() => unknown), props?: M & ThisType<M>): AsIon<T, M>
export function Ion<
   T,
   M
>(initialState: T, props?: M & ThisType<M & { value: T }>): AsIon<T, M>
export function Ion<
   T,
   M
>(initialState: T & (() => unknown) | T, props?: M & ThisType<M & { value: T }>): AsIon<T, M> {
   return asIon(initialState, props) as AsIon<T, M>
}

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


function asIon(
   initialState: unknown | (() => unknown),
   props?: AnyObject,
) {
   if (isFunction(initialState)) {
      return initializeSnapshots(createMemoizedDerivation(<Derivation>initialState, props, true))
   }

   if (isIon(initialState)) return initialState
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
