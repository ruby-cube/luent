import { isFunction } from "@rue/utils";
import { neutron } from "./Neutron";
import { createMaybeMemoizedIon } from "../ionic/DerivationIon";
import { createAtomicIon } from "./AtomicIon";
import { maybeIonize } from "../ionized/IonizedModel";

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
   return isFunction(maybeFn) ? maybeFn() : maybeFn;
}


type AsIon<T, M> = [T] extends [AtomicIon]? T  // [T] extends [AtomicIon] to prevent type-narrowing
: [T] extends [Derivation<infer R>] ? M extends Methods ? Ion<R, M> : Ion<R>
: M extends Methods ? AtomicIon<T, M & { state: T }> : AtomicIon<T>

/**
 * API
 * @param initialState 
 * @param methods 
 * @returns 
 */
export function ion<
   T,
   M
>(initialState: T, methods?: M & Methods): AsIon<T, M> {
   if (isIon(initialState)) return initialState as unknown as AsIon<T, M>
   if (isFunction(initialState)) {
      return createMaybeMemoizedIon(<Derivation>initialState, methods, true) as unknown as AsIon<T, M>
   }
   return createAtomicIon(initialState, methods) as unknown as AsIon<T, M>
}

ion.ionize = function createIonizedIon<T extends object, M>(initialState: T, methods?: M & Methods): M extends Methods ? AtomicIon<T, M> : AtomicIon<T> {
   return createAtomicIon(maybeIonize(initialState), methods, true) as unknown as M extends Methods ? AtomicIon<T, M> : AtomicIon<T>
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


const $count = ion(0)

const $doublecount = ion(() => {if (isIon($count)) return $count() * 2}, {
   doSomething(){}
})

const $countB = ion((prev?: number) => (prev ?? 0) + 2)

const $active = ion('frog', {
   toggle() {

   }
})

const $actived = ion(false, {
   toggler() { }
})

$actived.state = true

function som<T>(value: T): T {
   return null as T;
}

som(true)
