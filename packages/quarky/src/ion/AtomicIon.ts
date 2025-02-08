import { __DEV__traceMethodCall, emitSignal } from "../debug/debug";
import { isIonizedModel, ionize } from "../ionized/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { hasQuarks, Quarks, QUARKS, quarksOf } from "../Quarks";
import { __DEV__label } from "../debug/DEVLabellable";
import { __DEV__initTraceability, attachCapsuleMethods, CapsuleQuarks, Capsule } from "../capsule/Capsule";
import { getActiveTracker } from "../ionic/IonicCompound";
import { Atomic, WritableIon } from "./Ion";

/** INTERNAL */
export type $AtomicIon = WritableIon & Capsule & {
   [QUARKS]: AtomicIon
}

/** 
 * INTERNAL 
 * For reactive ions only.
 * */
export type AtomicIon = {
   state: any,
   stateIsIonized: boolean,
}
   & Quarks<$AtomicIon>
   & Atomic
   & CapsuleQuarks


function getReactiveState(ion: AtomicIon) {
   if (__DEV__) emitSignal();
   getActiveTracker()?.track(ion)
   return ion.state;
}


function setReactiveState(ion: AtomicIon, oldState: unknown, newState: unknown) {
   if (oldState === newState) {
      //TODO: I dunno how to implement this yet. For dev traces
      // if (__DEV__) ion.asAtom?.react() ?? (ion.asAtom = asAtom(ion), ion.asAtom.react())
      return oldState;
   }

   const state = shouldIonize(newState, ion.stateIsIonized) ? ionize(newState) : newState
   ion.state = state; // must set state before triggering effects and derivations
   ion.asAtom?.react()
   ion.asWatched?.triggerEffects()
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
   const $ion = (() => getReactiveState(ion)) as $AtomicIon

   const ion: AtomicIon = {
      state,
      stateIsIonized: isIonizedModel(state),
      entity: $ion,
      type: PRIMARY_ION,
      asAtom: undefined,
      asWatched: undefined,
      asReadonly: undefined,
      asReined: undefined,
      __DEV__asTraceable: undefined,
   }
   __DEV__initTraceability(ion)

   $ion[QUARKS] = ion
   $ion.__DEV__labelName = undefined
   $ion.__DEV__label = __DEV__label

   const capsuleName = 'AtomicIon'

   Object.defineProperty($ion, 'state', {
      get() {
         return ion.state;
      },
      set:  value => {
         __DEV__traceMethodCall(capsuleName, $ion, 'state')
         return setReactiveState(ion, ion.state, value);
      }
   })

   if (methods) {
      attachCapsuleMethods(capsuleName, $ion, methods)
   }

   return $ion
}

const PRIMARY_ION = Symbol('atomic ion')

/**
 * INTERNAL
 */
export function isAtomicIon(value: unknown): value is $AtomicIon {
   return hasQuarks(value) && quarksOf(value).type === PRIMARY_ION
}