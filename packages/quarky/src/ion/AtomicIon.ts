import { __DEV__traceMethodCall, Traceable } from "../debug/debug";
import { ionize } from "../ionized/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { EntityQuark, hasQuark, QUARK, QuarkOf, quarkOf } from "../Quark";
import { __DEV__label } from "../debug/DEVLabellable";
import { __DEV__initTraceability, attachCapsuleMethods, MutableCapsule } from "../capsule/Capsule";
import { AtomicIon } from "./ion";
import { unwatch, watch } from "../reactivity/Watched";
import { Atomic, getAtomicState } from "./Atomic";
import { Mutable, MutableEntity, Mutation, recordMutation } from "../mutation/Mutable";
import { trigger } from "../reactivity/trigger";

/** INTERNAL */
export type $AtomicIonState = AtomicIon & MutableCapsule & {
   [QUARK]: {
      type: symbol;
      state: any,
      ionized: boolean,
      trigger(): void
   } & Atomic & EntityQuark<$AtomicIonState>
} & MutableEntity

/** 
 * INTERNAL 
 * For reactive ions only.
 * */
export type AtomicIonQuark = QuarkOf<$AtomicIonState>

export function shouldIonize(newValue: unknown, ionized: boolean): newValue is AnyObject {
   return newValue instanceof Object && ionized;
}

/** INTERNAL */
export function createAtomicIon(
   state: any,
   methods?: object,
   ionized: boolean = false
) {
   const $state = (() => getAtomicState(ion, 'state', ion)) as $AtomicIonState

   const ion: AtomicIonQuark = {
      state,
      ionized,
      entity: $state,
      type: ATOMIC_ION,
      asMutable: new Mutable(),
      asParticle: undefined,
      asWatched: undefined,
      asReadonly: undefined,
      asReined: undefined,
      __DEV__asTraceable: new Traceable(),
      trigger,
      watch,
      unwatch: () => unwatch.call(ion)
   }

   $state[QUARK] = ion
   $state.__DEV__labelName = undefined as string | undefined
   $state.__DEV__label = __DEV__label

   const capsuleName = 'AtomicIon'

   Object.defineProperty($state, 'state', {
      get() {
         return ion.state;
      },
      set: value => {
         __DEV__traceMethodCall(capsuleName, $state, 'state')
         const oldState = ion.state;
         if (value === oldState) {
            //TODO: I dunno how to implement this yet. For dev traces
            // if (__DEV__) ion.asParticle?.triggerCompounds() ?? (ion.asParticle = asParticle(ion), ion.asParticle.triggerCompounds())
            return value;
         }
         const state = shouldIonize(value, ion.ionized) ? ionize(value) : value
         ion.state = state;
         recordMutation(ion, new Mutation(
            $state,
            '[[set]]',
            ['state', state],
            state,
            oldState
         ))
         ion.trigger()
         return state;
      }
   })

   if (methods) {
      attachCapsuleMethods(capsuleName, $state, methods)
   }

   return $state
}

const ATOMIC_ION = Symbol('atomic ion')

/**
 * INTERNAL
 */
export function isAtomicIon(value: unknown): value is $AtomicIonState {
   return hasQuark(value) && quarkOf(<$AtomicIonState>value).type === ATOMIC_ION
}

export function isAtomicIonQuark(value: unknown): value is AtomicIonQuark {
   return value instanceof Object && 'type' in value && value.type === ATOMIC_ION
}