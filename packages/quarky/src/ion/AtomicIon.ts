import { emitSignal } from "../debug/debug";
import { ionize } from "../ionized/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { hasQuark, Quark, QUARK, QuarkOf, quarkOf } from "../Quark";
import { MutableCapsule } from "../capsule/Capsule";
import { trigger, Watchable } from "../watch/Watched";
import { Mutable, MutableEntity, Mutation, recordMutation } from "../Mutable";
import { Traceable } from "../debug/Traceable";
import { debug, isObject } from "@rue/utils";
import { Ion, Methods, MutableIon } from "./Ion";
import { trackAtom } from "../ionic/IonicCompound";


/** INTERNAL */
export type $AtomicIonState =
   MutableIon<unknown>
   & MutableCapsule
   & MutableEntity
   & {
      [QUARK]: {
         mutable: boolean;
         props: AnyObject | undefined;
         state: any
         ionized: boolean,
      }
      & Quark<typeof ATOMIC_ION, $AtomicIonState>
      & Watchable
   }


/** 
 * INTERNAL 
 * For reactive ions only.
 * */
export type AtomicIonQuark = QuarkOf<$AtomicIonState>

export function shouldIonize(newValue: unknown, ionized: boolean): newValue is AnyObject {
   return isObject(newValue) && Boolean(ionized);
}

export const MUTABLE = true
export const IONIZED = true
export const ALL_METHODS = 'all_methods'

/** INTERNAL */
export function createAtomicIon(
   state: any,
   props?: Methods,
   mutable: boolean = true,
   ionized: boolean = false
) {
   const $state = (() => {
      if (__DEV__) emitSignal();
      trackAtom(quark)
      return quark.state;
   }) as $AtomicIonState


   const quark: AtomicIonQuark = {
      state,
      // stateKey,
      ionized,
      mutable,
      props,
      entity: $state,
      quarkType: ATOMIC_ION,
      asMutable: new Mutable(),
      asTraceable: new Traceable(),
      trigger,
      asWatched: undefined,
   }

   $state[QUARK] = quark

   if (mutable)
      // public properties

      if (props) {
         Object.defineProperty(props, 'state', {
            get: $state,
            set: setState.bind(quark)
         })
         Object.defineProperties($state, Object.getOwnPropertyDescriptors(props))
         // return quark.entity = createAtomicIonWithMethods(quark, mutable)
      }
      else {
         Object.defineProperty($state, 'state', {
            get: $state,
            set: setState.bind(quark)
         })

      }

   return $state
}

function attachCapsuleMethods(ion: Ion & AnyObject, props: AnyObject) {
   Object.defineProperties(ion, Object.getOwnPropertyDescriptors(props))
   // if (selectedMethods)
   //    for (const key in methods) {
   //       if (selectedMethods.has(key)){
   //          if (parentMethods && !parentMethods.has(key)) {
   //             ion[key] = useBlockedMethod(key)
   //             selectedMethods.delete(key)
   //          }
   //          else {
   //             ion[key] = methods[key].bind(thisIon)
   //          }
   //       }
   //       else ion[key] = useBlockedMethod(key)
   //    }
   // else
   // for (const key in methods) {
   //    ion[key] = methods[key].bind(thisIon)
   // }
}

const ATOMIC_ION = Symbol('atomic ion')

/**
 * INTERNAL
 */
export function isAtomicIon(value: unknown): value is $AtomicIonState {
   return hasQuark(value) && quarkOf(<$AtomicIonState>value).quarkType === ATOMIC_ION
}

export function isAtomicIonQuark(value: unknown): value is AtomicIonQuark {
   return value instanceof Object && 'quarkType' in value && value.quarkType === ATOMIC_ION
}


function setState(this: AtomicIonQuark, value: unknown) {
   const oldState = this.state;

   if (value === oldState) {
      return value;
   }
   const state = shouldIonize(value, this.ionized) ? ionize(value) : value
   this.state = state;

   recordMutation(this, new Mutation(
      this.entity,
      '[[set]]',
      ['state', state],
      state,
      oldState
   ))

   this.trigger()

   // runSyncEffects()

   return state;
}