import { __DEV__traceMethodCall, emitSignal, Traceable, TraceableSubject } from "../debug/debug";
import { isIonizedModel, ionize } from "../ionized/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { EntityQuarks, hasQuarks, QUARKS, QuarksOf, quarksOf } from "../Quarks";
import { __DEV__label } from "../debug/DEVLabellable";
import { __DEV__initTraceability, attachCapsuleMethods, MutableCapsule } from "../capsule/Capsule";
import { getActiveTracker } from "../ionic/IonicCompound";
import { Atomic, WritableIon } from "./Ion";
import { Mutation } from "../actions/Mutable";
import { unwatch, watch, Watched } from "../watch/Watched";

/** INTERNAL */
export type $AtomicIonState = WritableIon & MutableCapsule & {
   [QUARKS]: {
      state: any,
      stateIsIonized: boolean,
   } & Atomic & EntityQuarks<$AtomicIonState>
}

/** 
 * INTERNAL 
 * For reactive ions only.
 * */
export type AtomicIon = QuarksOf<$AtomicIonState>

function getReactiveState(ion: AtomicIon) {
   if (__DEV__) emitSignal();
   getActiveTracker()?.track(ion)
   return ion.state;
}


function setReactiveState(ion: AtomicIon, oldState: unknown, newState: unknown) {
   if (oldState === newState) {
      //TODO: I dunno how to implement this yet. For dev traces
      // if (__DEV__) ion.asParticle?.triggerCompounds() ?? (ion.asParticle = asParticle(ion), ion.asParticle.triggerCompounds())
      return oldState;
   }

   const state = shouldIonize(newState, ion.stateIsIonized) ? ionize(newState) : newState
   ion.state = state; // must set state before triggering effects and derivations
   const { recordOp, asParticle, asWatched } = ion
   const mutation = recordOp || asParticle ? new Mutation(
      ion,
      '[[set]]',
      ['state', newState],
      newState,
      oldState
   ) : undefined
   recordOp?.(mutation!)
   asParticle?.triggerCompounds(mutation!)
   asWatched?.triggerEffects()
   return state;
}

function shouldIonize(newValue: unknown, stateIsIonized: boolean): newValue is AnyObject {
   return newValue instanceof Object && stateIsIonized;
}

/** INTERNAL */
export function createPrimaryIon(
   state: any,
   methods?: object
) {
   const $state = (() => getReactiveState(ion)) as $AtomicIonState

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

   $state[QUARKS] = ion
   $state.__DEV__labelName = undefined as string | undefined
   $state.__DEV__label = __DEV__label

   const capsuleName = 'AtomicIon'

   Object.defineProperty($state, 'state', {
      get() {
         return ion.state;
      },
      set: value => {
         __DEV__traceMethodCall(capsuleName, $state, 'state')
         return setReactiveState(ion, ion.state, value);
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
   return hasQuarks(value) && quarksOf(<$AtomicIonState>value).type === PRIMARY_ION
}