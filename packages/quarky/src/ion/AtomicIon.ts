import { __DEV__traceMethodCall, emitSignal, Traceable, TraceableSubject } from "../debug/debug";
import { isIonizedModel, ionize } from "../ionized/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { EntityQuark, hasQuark, QUARK, QuarkOf, quarkOf } from "../Quark";
import { __DEV__label } from "../debug/DEVLabellable";
import { __DEV__initTraceability, attachCapsuleMethods, MutableCapsule } from "../capsule/Capsule";
import { getActiveTracker } from "../ionic/IonicCompound";
import { WritableIon } from "./Ion";
import { Mutable, Mutation } from "../actions/Mutable";
import { unwatch, watch, Watched } from "../watch/Watched";
import { ParticleMorph } from "../Compound/Particle";
import { Atomic, getAtomicState, setAtomicState } from "./Atomic";

/** INTERNAL */
export type $AtomicIonState = WritableIon & MutableCapsule & {
   [QUARK]: {
      type: symbol;
      state: any,
      stateIsIonized: boolean,
   } & Atomic & EntityQuark<$AtomicIonState>
}

/** 
 * INTERNAL 
 * For reactive ions only.
 * */
export type AtomicIon = QuarkOf<$AtomicIonState>

function shouldIonize(newValue: unknown, stateIsIonized: boolean): newValue is AnyObject {
   return newValue instanceof Object && stateIsIonized;
}

/** INTERNAL */
export function createPrimaryIon(
   state: any,
   methods?: object
) {
   const $state = (() => getAtomicState(ion, 'state', ion)) as $AtomicIonState

   const ion: AtomicIon = {
      state,
      stateIsIonized: isIonizedModel(state),
      entity: $state,
      type: PRIMARY_ION,
      asParticle: undefined,
      asWatched: undefined,
      asReadonly: undefined,
      asReined: undefined,
      recordOp: undefined,
      __DEV__asTraceable: new Traceable(),

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
         const state = shouldIonize(value, ion.stateIsIonized) ? ionize(value) : value
         return setAtomicState(ion, 'state', ion, ion.state, state);
      }
   })

   if (methods) {
      attachCapsuleMethods(capsuleName, $state, methods)
   }

   return $state
}

const PRIMARY_ION = Symbol('atomic ion')

/**
 * INTERNAL
 */
export function isAtomicIon(value: unknown): value is $AtomicIonState {
   return hasQuark(value) && quarkOf(<$AtomicIonState>value).type === PRIMARY_ION
}