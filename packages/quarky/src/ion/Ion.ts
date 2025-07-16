import { debug, isFunction } from "@rue/utils";
import { neutron } from "./Neutron";
import { createMaybeMemoizedIon } from "../ionic/DerivationIon";
import { createAtomicIon, IONIZED, MUTABLE } from "./AtomicIon";
import { maybeIonize } from "../ionized/IonizedModel";
import { AnyObject, ExcludePrimitives, OnlyPrimitives } from "@rue/types";
import { Ionized, IsIonized } from "../ionized/ionize";
import { Inert, IsInert } from "../ionized/inert";
import { initializeSnapshots } from "../ionized/TimeTraveler";

/* API */
export type Ion<T = unknown> = () => T

type MaybeInert<T = unknown> = IsIonized<ExcludePrimitives<T>> extends true ? T : IsInert<ExcludePrimitives<T>> extends true ? T : T extends object ? Inert<ExcludePrimitives<T>> | OnlyPrimitives<T> : T

export type MutableIon<T> = Ion<T> & { state: T }


// NOTE: deprecating NonVoid because extending generic as NonVoid causes type-narrowing
// export type NonVoid = string | number | object | undefined | boolean | bigint | symbol | null

type Derivation<R = unknown> = (prevValue?: R) => R

export type Methods = AnyObject
// { [key: PropertyKey]: (...args: any) => any }

type PickMethods = (...args: string[]) => ReinConfig

type ReinConfig = { capsule: AnyObject, selectedMethods: string[] }

export function isIon(value: unknown): value is Ion {
   return isFunction(value) && /^\$[a-z]/.test(value.name) && value.length === 0
}


export function toIon<T>(value: T): T extends Ion ? T : Ion<T> {
   return (isIon(value) ? value : neutron(value)) as T extends Ion ? T : Ion<T>
}

export function toValue<T>(maybeFn: T): T extends () => infer R ? R : T {
   return isFunction(maybeFn) ? maybeFn() : maybeFn as T extends () => infer R ? R : T;
}


type AsIon<T, M = {}> = [T] extends [MutableIon<unknown>] ? T // [T] extends [AtomicIon] to prevent type-narrowing
   : [T] extends [Derivation<infer R>] ? Ion<R> & M
   : MutableIon<T> & M



/**
 * Creates an ion, ion capsule, or derivation ion, depending on parameters.
 * 
 * ##### ION:
 * ```
 * const $count = ion(0)
 * ```
 * 
 * ##### ION CAPSULE:
 * ```
 * const $count = ion(0, {
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
 * const $doubleCount = ion(() => $count() * 2)
 * ```
 * 
 * 
 * //TODO: what should happen when you pass an ion as the initial state?
 * 
 * @param initialState or pure getter for derivations
 * @param methods optional
 * @returns `Ion<T>`
 */

export function ion<
   T,
   M
>(initialState: T & (() => unknown), props?: M & ThisType<M>): AsIon<T, M>
export function ion<
   T,
   M
>(initialState: T, props?: M & ThisType<M & { state: T }>): AsIon<T, M>
export function ion<
   T,
   M
>(initialState: T & (() => unknown) | T, props?: M & ThisType<M & { state: T }>): AsIon<T, M> {
   return asIon(initialState, MUTABLE, false, props) as AsIon<T, M>
}


// function createIonizedIon<
//    T extends Record<string, unknown>,
//    M
// >(initialStateDefinition: T, methods: M & Methods): AsMutableIon<T, M> {
//    return asIon(initialStateDefinition, MUTABLE, IONIZED, methods) as AsMutableIon<T, M>
// }

// type State<D> = [D] extends [StateDef<infer T>] ? T : D

ion.ionize = createIonizedIon
// ion.mu = createMutableIon
// createMutableIon.ionize = createMutableIonizedIon
// createMutableIonizedIon.mu = createDeepMutableIonizedIon




function createIonizedIon<
   T,
   M
>(initialState: T, methods?: M & Methods): AsIon<Ionized<ExcludePrimitives<T>> | OnlyPrimitives<T>, M> {
   return asIon(initialState, MUTABLE, IONIZED, methods) as AsIon<Ionized<ExcludePrimitives<T>> | OnlyPrimitives<T>, M> //TODO: add inert marks
}

// function createDeepMutableIonizedIon<
//    T extends Record<string, unknown>,
//    M
// >(initialStateDefinition: T, methods: M & Methods): AsMutableIon<T, M>
// function createDeepMutableIonizedIon<
//    T extends unknown,
//    M
// >(initialStateDefinition: T): AsMutableIon<T, M>
// function createDeepMutableIonizedIon<
//    T extends Record<string, unknown> | unknown,
//    M
// >(initialStateDefinition: T, methods?: M & Methods): AsMutableIon<T, M> {
//    return asIon(initialStateDefinition, MUTABLE, MUTABLE_IONIZED, methods) as AsMutableIon<T, M>
// }





/**
 * 
 * Creates a *mutable* ion or ion capsule.
 * 
 * Simple ion example:
 * ```
 * const $count = ion.mu(0)
 * ```
 * 
 * Ion capsule example:
 * ```
 * const $count = ion.mu({ 
 *    'count': 0 
 * }, {
 *    increment() {
 *       this.count++
 *    },
 *    decrement() {
 *       this.count--
 *    }
 * })
 * ```
 * @param initialState 
 * @param methods 
 * @returns 
 */
// export function createEncapsulatedIon<
//    T extends Record<string, unknown>,
//    M
// >(initialStateDefinition: T, methods: M & Methods & ThisType<M & (T extends Record<string, unknown> ? T : {})>): AsIon<T, M>
// export function createEncapsulatedIon<
//    T extends unknown,
//    M
// >(initialStateDefinition: T): AsIon<T, M>
// export function createEncapsulatedIon<
//    T extends unknown | Record<string, unknown>,
//    M
// >(initialStateDefinition: T, methods?: M & Methods & ThisType<M & (T extends Record<string, unknown> ? T : {})>): AsIon<T, M> {
//    return asIon(initialStateDefinition, !MUTABLE, !IONIZED, methods) as AsIon<T, M>
// }

function asIon(
   initialState: unknown | (() => unknown),
   mutable: boolean,
   ionized: boolean,
   props?: AnyObject,
) {
   if (isFunction(initialState)) {
      return initializeSnapshots(createMaybeMemoizedIon(<Derivation>initialState, props, true))
   }

   if (isIon(initialState)) return initialState
   return initializeSnapshots(createAtomicIon(ionized ? maybeIonize(initialState) : initialState, props, mutable, ionized)) // TODO: add inert mark map
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

// const $doublecount = ion(() => {if (isIon($count)) return $count() * 2}, {
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

// $actived.state = true

// function som<T>(value: T): T {
//    return null as T;
// }

// som(true)
