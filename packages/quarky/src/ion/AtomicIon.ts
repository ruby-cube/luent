import { emitSignal } from "../debug/debug";
import { InertMark } from "../ionic/ionize";
import { AnyObject } from "@rue/types";
import { __DEV__getTrace, } from "../../../flask/debug";
import { __DEV__trace } from "../debug/debug";
import { hasQuark, Quark, QUARK, quarkOf } from "../abstract/Quark";
import { trigger, Watchable, Watched } from "../reactivity/Watched";
import { Mutable } from "../Mutable";
import { Traceable } from "../debug/Traceable";
import { MutableIon } from "./Ion";
import { ModelQuark } from "../ionic/ModelQuark";
import { trackParticle } from "../abstract/Compound";
import { Update, isLazyUpdate, initUpdate } from "../reactivity/UpdateCycle";
import { maybeIonize, MarkMap } from "../ionic/Ionic";
import { ILazyState } from "../reactivity/LazyState";
import { AtomicQuark } from "../abstract/AtomicQuark";
import { isObjectLiteral } from "@rue/utils";

export const IONIZED = true
export const ALL_METHODS = 'all_methods'


/** INTERNAL */
export type $AtomicIonState = MutableIon<unknown> & { [QUARK]: AtomicIonQuark }


/**
 * Quark for atomic ion, pion, and atomic get op
*/


export class AtomicIonQuark extends AtomicQuark {
   track = () => trackParticle(this)

   constructor(
      public state: ILazyState,
      public modelQuark?: ModelQuark,
      public customTrack?: () => void,
      public customTrigger?: () => void
   ) {
      super()
      this.__DEV__asTraceable = modelQuark?.__DEV__asTraceable ?? new Traceable()
      if (customTrigger || modelQuark) this.trigger = (update: Update) => {
         trigger.apply(this, [update])
         modelQuark?.trigger(update)
         customTrigger?.()
      }
      if (customTrack) this.track = () => {
         trackParticle(this)
         customTrack.apply(this)
      }
   }
   __DEV__asTraceable: Traceable;

   transformGet?: (value: unknown) => unknown
   transformSet?: (value: unknown, fail: typeof FAIL) => unknown | typeof FAIL
}



/** INTERNAL */
export function createAtomicIon(
   quark: AtomicIonQuark,
   ionized: boolean,
   mark?: InertMark | MarkMap | undefined,
   props?: AnyObject
) {
   const $state = getState.bind(quark) as $AtomicIonState
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
   this.track()
   const state = isLazyUpdate() ? this.state.pending : this.state.current
   return this.transformGet ? this.transformGet(state) : state;
}

const FAIL = Symbol('fail')

export function setState(this: AtomicIonQuark, value: unknown) {
   const newState = this.transformSet ? this.transformSet(value, FAIL) : value;
   if (newState === FAIL) return;

   // const oldState = state.previous;
   // if (newState === oldState) { //NOTE: we cannot do this if we are cloning arrays--the new array needs to be updated with all changes
   //    return newState;
   // }
   const state = this.state

   const update = initUpdate()

   // set state
   if (update.lazy) {
      state.pending = newState
   }
   else {
      state.current = newState;
   }

   const pendingUpdate = this.pendingUpdate
   if (pendingUpdate === update) {
      return state;
   }

   if (pendingUpdate && pendingUpdate !== update) {
      pendingUpdate.cancel()
   }

   if (update.lazy) {
      this.pendingUpdate = update

      update.onComplete(() => {
         state.commitChange()
         this.pendingUpdate = null;
      })

      update.onCancel(() => {
         state.cancelChange()
         this.pendingUpdate = null;
      })
   }
   // trigger effects
   this.trigger(update)
   this.modelQuark?.trigger(update); // TODO: Do I need this? For absorbed ions?

   return state;
}