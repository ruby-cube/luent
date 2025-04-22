import { debug, isFunction } from "@rue/utils";
import { neutron } from "./Neutron";
import { createMaybeMemoizedIon } from "../ionic/DerivationIon";
import { createAtomicIon, IONIZED, MUTABLE, MUTABLE_IONIZED } from "./AtomicIon";
import { maybeIonize } from "../ionized/IonizedModel";
import { Ionized } from "../ionized/ionize";
import { finiton } from "./FiniteStates";
import { AnyObject } from "@rue/types";

/* API */
export type Ion<T = unknown, M = {}> = (() => T) & M

/* API */  // atomic ions, neutrons, and pions
export type AtomicIon<T = unknown, M = { state: T }> = (() => T) & M & { state: T }

// NOTE: deprecating NonVoid because extending generic as NonVoid causes type-narrowing
// export type NonVoid = string | number | object | undefined | boolean | bigint | symbol | null

type Derivation<R = unknown> = (prevValue?: R) => R

export type Methods = { [key: PropertyKey]: (...args: any) => any }


export function isIon(value: unknown): value is Ion {
   return isFunction(value) && /^\$[a-z]/.test(value.name) && value.length === 0
}


export function toIon<T>(value: T): T extends Ion ? T : Ion<T> {
   return (isIon(value) ? value : neutron(value)) as T extends Ion ? T : Ion<T>
}

export function toValue<T>(maybeFn: T): T extends () => infer R ? R : T {
   return isFunction(maybeFn) ? maybeFn() : maybeFn as T extends () => infer R ? R : T;
}


type AsIon<T, M> = [T] extends [AtomicIon] ? T  // [T] extends [AtomicIon] to prevent type-narrowing
   : [T] extends [Derivation<infer R>] ? M extends Methods ? Ion<R, M> : Ion<R>
   : M extends Methods ? AtomicIon<T, M & { state: T }> : AtomicIon<T>

/**
 * API
 * Creates an ion capsule. //TODO: what happens when you pass an ion as the initial state?
 * 
 * @param initialState 
 * @param methods 
 * @returns 
 */
export function ion<
   T extends Record<string, unknown>,
   M
>(initialStateDefinition: T, methods: M & ThisType<M & (T extends Record<string, unknown> ? T : {})>): AsIon<State<T>, M>
export function ion<
   T extends () => unknown,
   M
>(initialStateDefinition: T, methods?: M & ThisType<M & (T extends Record<string, unknown> ? T : {})>): AsIon<State<T>, M>
export function ion<
   T extends Record<string, unknown> | (() => unknown),
   M
>(initialStateDefinition: T, methods?: M & ThisType<M & (T extends Record<string, unknown> ? T : {})>): AsIon<State<T>, M> {
   return asIon(initialStateDefinition, false, false, methods) as AsIon<State<T>, M>
}


function createIonizedIon<
   T extends Record<string, unknown>,
   M
>(initialStateDefinition: T, methods: M & Methods): AsIon<State<T>, M> {
   return asIon(initialStateDefinition, false, IONIZED, methods) as AsIon<State<T>, M>
}

type State<D> = D extends Record<string, infer T> ? T : D

ion.ionize = createIonizedIon
ion.mu = createMutableIon
createMutableIon.ionize = createMutableIonizedIon
createMutableIonizedIon.mu = createDeepMutableIonizedIon

ion.finite = finiton


function createMutableIonizedIon<
   T extends Record<string, unknown>,
   M
>(initialStateDefinition: T, methods: M & Methods): AsIon<State<T>, M> 
function createMutableIonizedIon<
   T extends unknown,
   M
>(initialStateDefinition: T): AsIon<State<T>, M> 
function createMutableIonizedIon<
   T extends Record<string, unknown> | unknown,
   M
>(initialStateDefinition: T, methods?: M & Methods): AsIon<State<T>, M> {
   return asIon(initialStateDefinition, MUTABLE, IONIZED, methods) as AsIon<State<T>, M>
}

function createDeepMutableIonizedIon<
   T extends Record<string, unknown>,
   M
>(initialStateDefinition: T, methods: M & Methods): AsIon<State<T>, M> 
function createDeepMutableIonizedIon<
   T extends unknown,
   M
>(initialStateDefinition: T): AsIon<State<T>, M> 
function createDeepMutableIonizedIon<
   T extends Record<string, unknown> | unknown,
   M
>(initialStateDefinition: T, methods?: M & Methods): AsIon<State<T>, M> {
   return asIon(initialStateDefinition, MUTABLE, MUTABLE_IONIZED, methods) as AsIon<State<T>, M>
}





/**
 * API
 * @param initialState 
 * @param methods 
 * @returns 
 */
export function createMutableIon<
   T extends Record<string, unknown>,
   M
>(initialStateDefinition: T, methods: M & ThisType<M & (T extends Record<string, unknown> ? T : {})>): AsIon<State<T>, M>
export function createMutableIon<
   T extends unknown,
   M
>(initialStateDefinition: T): AsIon<State<T>, M>
export function createMutableIon<
   T extends unknown | Record<string, unknown>,
   M
>(initialStateDefinition: T, methods?: M & ThisType<M & (T extends Record<string, unknown> ? T : {})>): AsIon<State<T>, M> {
   return asIon(initialStateDefinition, MUTABLE, IONIZED, methods) as AsIon<State<T>, M>
}

function asIon(
   initialStateDefinition: unknown | Record<string, unknown> | (() => unknown),
   mutable: boolean,
   ionized: boolean | 'mutable',
   methods?: AnyObject,
) {
   if (isFunction(initialStateDefinition)) {
      return createMaybeMemoizedIon(<Derivation>initialStateDefinition, methods, true)
   }
   const [stateKey, initialState] = methods ? getStateKeyAndInitialState(initialStateDefinition as AnyObject) : ['state', initialStateDefinition]
   if (isIon(initialState)) return initialState
   return createAtomicIon(ionized ? maybeIonize(initialState) : initialState, stateKey, methods, mutable, ionized)
}

function getStateKeyAndInitialState(initialStateDefinition: AnyObject) {
   const defKeys = Object.keys(initialStateDefinition)
   if (defKeys.length !== 1) debug.error('[Invalid Input]: Ion state definition of an ion capsule must have one (and only one) property. The key must be a string')
   const stateKey = defKeys[0] ?? 'value'
   const initialState = initialStateDefinition[stateKey]
   return [stateKey, initialState]
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
