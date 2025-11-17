import { emitSignal } from "../debug/debug";
import { InertMark } from "../ionic/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { hasQuark, Quark, QUARK, quarkOf } from "../abstract/Quark";
import { trigger, Atom, TrackedAtom } from "../reactivity/Atom";
import { Traceable } from "../debug/Traceable";
import { MutableIon } from "./Ion";
import { track } from "../reactivity/Compound";
import { Update } from "../reactivity/Update";
import { maybeIonize, MarkMap, IonicProxy } from "../ionic/Ionic";
import { isFunction, isObjectLiteral } from "@rue/utils";
import { SimpleState } from "../reactivity/State";
import { ModelQuark } from "../ionic/IonicModel";
import { Mode } from "fs";
import { getActiveFlask } from "@rue/flask";

export const IONIZED = true
export const ALL_METHODS = 'all_methods'


/** INTERNAL */
export type QuarkyAtomicIon = MutableIon<unknown> & { [QUARK]: AtomicIonQuark }

export interface IonHooks {
   '@get'?: (value: unknown) => void,
   '@set'?: (event: { value: unknown, previous: unknown }) => void
}

/**
 * Quark for atomic ion, pion, and atomic get op
*/

const ATOMIC_ION = Symbol('atomic ion')

export class AtomicIonQuark implements Atom, Quark {
   __DEV__asTraceable: Traceable = new Traceable()
   quarkType: string | symbol = ATOMIC_ION

   castGet: ((value: unknown) => void) | undefined
   castSet: ((event: { value: unknown; previous: unknown; }) => void) | undefined;

   constructor(
      public state: SimpleState,
      hooks: IonHooks | undefined
   ) {
      this.castGet = hooks?.["@get"]
      this.castSet = hooks?.["@set"]
   }

   asTrackedAtom: TrackedAtom | undefined;
}



/** INTERNAL */
export function createAtomicIon(
   quark: AtomicIonQuark,
   props?: AnyObject
) {

   const $state = (quark.castGet ? withGetHook(getState.bind(quark), quark.castGet) : function () { return getState.apply(quark) }) as QuarkyAtomicIon

   $state[QUARK] = quark
   if (__DEV__) {
      //@ts-expect-error
      $state.displayName = 'getState'
   }

   if (props) {
      const descriptors = Object.getOwnPropertyDescriptors(props)
      if (__DEV__ && !isObjectLiteral(props)) throw new Error('additional ion props and methods must be defined in an object literal') // TODO: allow classes and prototypes?
      if (__DEV__ && 'value' in descriptors) throw new Error('Overriding .value property disallowed. Use @get and @set hooks to add behavior')
      delete descriptors['@get'];
      delete descriptors['@set'];
      Object.defineProperties($state, descriptors)
   }

   Object.defineProperty($state, 'value', {
      get: $state,
      set: quark.castSet ? withSetHook(setState.bind(quark), quark.castSet, () => quark.state.get()) : setState.bind(quark)
   })

   return $state
}


export function getState(this: AtomicIonQuark) {
   track(this)
   return this.state.get()
}

export function setState(this: AtomicIonQuark, value: unknown) {
   this.state.set(value)
   trigger(this, this.state.pendingUpdate!)
   return value;
}


export function withGetHook(getState: () => unknown, castGet: (value: unknown) => void) {
   function $state() {
      const value = getState();
      castGet(value)
      return value;
   }
   // preserve monomorphism
   $state.value = undefined
   $state[QUARK] = undefined
   return $state
}

export function withSetHook<T = unknown>(set: (value: unknown) => T, castSet: (event: { value: unknown, previous: unknown }) => void, getState: () => unknown) {
   return function setState(value: unknown) {
      const previous = getState()
      const output = set(value)
      castSet({ value, previous })
      return output;
   }
}