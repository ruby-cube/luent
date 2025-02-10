import { MaybeParticle } from "../Compound/Particle";
import { asPropIon } from "../ionized/Pion";
import { Watchable } from "../watch/Watched";
import { createPrimaryIon } from "./AtomicIon";
import { isFunction } from "@rue/utils";

/* API */
export type Ion<T extends NonVoid = NonVoid, M extends Methods = {}> = (() => T) & M

type Methods = { [key: PropertyKey]: (...args: any) => any }

/* API */  // basically writable atomic ions, neutrons, and pions
export type WritableIon<T extends NonVoid = NonVoid, M extends Methods = {}> = Ion<T> & {
   state: T
} & M

export type NonVoid = string | number | object | undefined | boolean | bigint | symbol | null

/* API */
export type MemoizedIon<T extends NonVoid = NonVoid, M extends Methods = {}> = Ion<T> & {
   releaseAtoms: () => void //TODO: rename to something else or eliminate
} & M

export function isIon(value: unknown): value is Ion {
   return isFunction(value) && /^\$[a-z]/.test(value.name) && value.length === 0
}

export function toIon<T>(value: T): T extends Ion ? T : Ion<T> {
   return isIon(value) ? value : neutron(value) as T extends Ion ? T : Ion<T>
}


export function toValue(maybeFn: any){
  return isFunction(maybeFn)? maybeFn(): maybeFn;
}

// isIon // any sort of ion
// isAtomic // primary
// isNeutron // known inert
// isMemoized // memoized derivation
// isWritable
// isCapsule
// isPropIon
// isAbsorbedIon
// isIonized
// isReactive
// isReadonly
// isReined


export type Atomic = MaybeParticle & Watchable


// const $doubleCount = ion.memo(() => {

// })

// const $count = ion.inert(0)



// API
export function ion<T, M>(value?: T & (() => any), methods?: M & IonMethods): T extends (arg?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
export function ion<T, M>(value?: T, methods?: M & IonMethods): ReactiveIon<T, M>
export function ion<T, M>(value?: T, methods?: M & IonMethods): T extends AnyIon ? T : T extends (arg?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M> {
   if (isIon(value)) {
      if (__DEV__ && methods) console.warn(`Cannot make an existing ion into an ion. Methods will not be attached`)
      return value as T extends AnyIon ? T : T extends (args?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
   }
   if (isFunction(value)) {
      if (methods)
         return createWritableDerivedIon(
            <(prev?: any) => unknown>value,
            methods
         ) as T extends AnyIon ? T : T extends (arg?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
      return createDerivationIon(<(prev?: any) => unknown>value) as T extends AnyIon ? T : T extends (arg?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
   }
   return createPrimaryIon(value, methods) as T extends AnyIon ? T : T extends (args?: any) => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
}

ion.of = asPropIon
