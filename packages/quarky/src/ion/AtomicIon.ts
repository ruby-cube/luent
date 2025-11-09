import { emitSignal } from "../debug/debug";
import { InertMark } from "../ionic/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { hasQuark, Quark, QUARK, quarkOf } from "../abstract/Quark";
import { trigger, Atom, TrackedAtom } from "../reactivity/Atom";
import { Traceable } from "../debug/Traceable";
import { MutableIon } from "./Ion";
import { ModelQuark } from "../ionic/ModelQuark";
import { trackParticle } from "../abstract/Compound";
import { Update} from "../reactivity/Update";
import { maybeIonize, MarkMap } from "../ionic/Ionic";
import { isObjectLiteral } from "@rue/utils";
import { SimpleState } from "../reactivity/State";

export const IONIZED = true
export const ALL_METHODS = 'all_methods'


/** INTERNAL */
export type QuarkyAtomicIon = MutableIon<unknown> & { [QUARK]: AtomicIonQuark }


/**
 * Quark for atomic ion, pion, and atomic get op
*/

const ATOMIC_ION = Symbol('atomic ion')

export class AtomicIonQuark implements Atom, Quark {
   __DEV__asTraceable: Traceable = new Traceable()
   quarkType: string | symbol = ATOMIC_ION

   constructor(
      public state: SimpleState,
   ) { }

   asTrackedAtom: TrackedAtom | undefined;
   pendingUpdate: Update | null = null

   transformGet: (value: unknown) => unknown = (value) => value
   transformSet: (value: unknown, fail: typeof FAIL) => unknown | typeof FAIL = (value) => value
}



/** INTERNAL */
export function createAtomicIon(
   quark: AtomicIonQuark,
   ionized: boolean,
   mark?: InertMark | MarkMap | undefined,
   props?: AnyObject
) {
   const $state = getState.bind(quark) as QuarkyAtomicIon
   $state[QUARK] = quark
   //@ts-expect-error
   $state.displayName = 'getState'

   if (props) {
      if (!isObjectLiteral(props)) throw new Error('additional ion props and methods must be defined in an object literal') // TODO: allow classes and prototypes?
      const descriptors = Object.getOwnPropertyDescriptors(props)
      const onGet = descriptors.value?.get
      const onSet = descriptors.value?.set as (value: unknown) => boolean
      if (onGet) {
         quark.transformGet = ionized ? (value: unknown) => {
            return onGet.apply({ value: maybeIonize(value, mark) })
         } : (value) => onGet.apply({ value })
      }
      if (onSet) {
         quark.transformSet = (value: unknown, fail: typeof FAIL) => {
            const state = { value: $state() }
            const success = onSet.apply(state, [value])
            if (success === false) return fail;
            return state.value;
         }
      }
      delete descriptors.value
      Object.defineProperties($state, descriptors)
   }
   else if (ionized) {
      quark.transformGet = (value: unknown) => {
         return maybeIonize(value, mark)
      }
   }

   Object.defineProperty($state, 'value', {
      get: $state,
      set: setState.bind(quark)
   })

   return $state
}


function getState(this: AtomicIonQuark) {
   if (__DEV__) emitSignal();
   trackParticle(this)
   return this.transformGet(this.state.get())
}

const FAIL = Symbol('fail')

export function setState(this: AtomicIonQuark, value: unknown) {
   const newState = this.transformSet(value, FAIL);
   if (newState === FAIL) return this.state.current;

   this.state.set(newState)

   trigger(this, this.state.pendingUpdate!)

   return newState;
}