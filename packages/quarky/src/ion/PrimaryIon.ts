import { __DEV__traceMethodCall, emitSignal } from "../debug/debug";
import { isIonizedModel, ionize } from "../ionized/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { hasQuarks, Quarks, QUARKS, quarksOf } from "../QuarkyEntity";
import { __DEV__label } from "../debug/DEVLabellable";
import { WritableMuon } from "../reactivity/reactivity-system";
import { __DEV__initTraceability, attachCapsuleMethods, CapsuleQuarks, Capsule } from "../capsule/Capsule";
import { getActiveTracker } from "../ionic/IonicCompound";
import { PrimaryMuon } from "../muon/PrimaryMuon";

/** INTERNAL */
export type $PrimaryIon = WritableMuon & Capsule & {
   [QUARKS]: PrimaryIon
}

/** 
 * INTERNAL 
 * For reactive ions only.
 * */
export type PrimaryIon = {
   state: any,
   stateIsIonized: boolean,
}
   & Quarks<$PrimaryIon>
   & PrimaryMuon
   & CapsuleQuarks


function getReactiveState(ion: PrimaryIon) {
   if (__DEV__) emitSignal();
   const tracker = getActiveTracker()
   if (!tracker)
      return ion.state
   tracker.track(ion)
   return ion.state;
}


function setReactiveState(ion: PrimaryIon, oldState: unknown, newState: unknown) {
   if (oldState === newState) {
      //TODO: I dunno how to implement this yet. For dev traces
      // if (__DEV__) ion.asIonicAtom?.react() ?? (ion.asIonicAtom = asAtom(ion), ion.asIonicAtom.react())
      return oldState;
   }

   const state = shouldIonize(newState, ion.stateIsIonized) ? ionize(newState) : newState
   ion.state = state; // must set state before triggering effects and derivations
   ion.asIonicAtom?.react()
   ion.asWatchSubject?.triggerEffects()
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
   const $ion = (() => getReactiveState(ion)) as $PrimaryIon

   let stateIsIonized = isIonizedModel(state)

   const ion: PrimaryIon = {
      state,
      stateIsIonized: isIonizedModel(state),
      entity: $ion,
      type: PRIMARY_ION,
      asIonicAtom: undefined,
      asWatchSubject: undefined,
      __DEV__asTraceable: undefined,
      asReadonly: undefined,
      asReined: undefined,
   }
   __DEV__initTraceability(ion)

   $ion[QUARKS] = ion
   $ion.__DEV__labelName = undefined
   $ion.__DEV__label = __DEV__label

   const capsuleName = 'PrimaryIon'

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
export function isAtomicIon(value: unknown): value is $PrimaryIon {
   return hasQuarks(value) && quarksOf(value).type === PRIMARY_ION
}