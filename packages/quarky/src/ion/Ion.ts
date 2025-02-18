import { isFunction } from "@rue/utils";
import { neutron } from "./Neutron";
import { createMaybeMemoizedIon } from "../ionic/DerivationIon";
import { createAtomicIon } from "./AtomicIon";
import { ionize } from "../ionized/ionize";
import { maybeIonize } from "../ionized/IonizedModel";

/* API */
export type Ion<T extends NonVoid = NonVoid, M = {}> = (() => T) & M

/* API */  // atomic ions, neutrons, and pions
export type AtomicIon<T extends NonVoid = NonVoid, M = { state: T }> = (() => T) & M & { state: T }

export type NonVoid = string | number | object | undefined | boolean | bigint | symbol | null

export type Methods = { [key: PropertyKey]: (...args: any) => any }


export function isIon(value: unknown): value is Ion {
   return isFunction(value) && /^\$[a-z]/.test(value.name) && value.length === 0
}

export function toIon<T extends NonVoid | Ion>(value: T): T extends Ion ? T : Ion<T> {
   return (isIon(value) ? value : neutron(value)) as T extends Ion ? T : Ion<T>
}

export function toValue<T>(maybeFn: T): T extends () => infer R ? R : T {
   return isFunction(maybeFn) ? maybeFn() : maybeFn;
}

type Derivation<R extends NonVoid = NonVoid> = (prevValue?: R) => R
type IonReturn<T extends NonVoid, M> = T extends Derivation<infer R> ? Ion<Broad<R>, M> : M extends Methods ? AtomicIon<Broad<T>, M> : AtomicIon<Broad<T>>

type Broad<T> = T extends boolean ? boolean : T extends string ? string : T extends number ? number : T;

export function ion<
   T extends NonVoid,
   M
>(initialState: T, methods?: M & Methods): T extends Derivation<infer R> ? Ion<Broad<R>, M> : M extends Methods ? AtomicIon<Broad<T>, M> : AtomicIon<Broad<T>> {
   if (isIon(initialState)) return initialState as unknown as IonReturn<T, M>
   if (isFunction(initialState)) {
      return createMaybeMemoizedIon(<Derivation>initialState, methods, true) as unknown as IonReturn<T, M>
   }
   return createAtomicIon(initialState, methods) as unknown as IonReturn<T, M>
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


// const $count = ion(0)

// const $doublecount = ion(() => $count() * 2)

// const $countB = ion((prev?: number) => (prev ?? 0) + 2, {
//    toggler() {

//    }
// })

// const $active = ion('frog', {
//    toggle() {

//    }
// })

// const $actived = ion(false)

// $actived.state = true

// function som<T>(value: T): T {
//    return null as T;
// }

// som(true)
