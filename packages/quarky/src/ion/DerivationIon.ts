import { Reaction } from "../reactivity/Reaction";
import { FunctionSubstance } from "../reactivity/Substance";
import { QUARK } from "../abstract/Quark";
import { AnyObject } from "@luent/types";
import { Traceable } from "../debug/Traceable";
import { $activeUpdate } from "../reactivity/Update";
import { track } from "../reactivity/Compound";
import { queueCommit, SimpleState } from "../reactivity/State";
import { isPlainObject } from "@luent/utils";
import { Stateful } from "../abstract/Stateful";
import { SYNC } from "../reactivity/RenderCycle";


export class DerivationIonQuark extends FunctionSubstance implements Stateful {

   constructor(
      fn: () => unknown,
      retrack: boolean,
      warnNoAtoms?: boolean
   ) {
      super(
         fn,
         retrack,
         warnNoAtoms
      )
   }

   getState(): unknown {
      return this.trackedCall()
   }

   get inert() {
      return !this.reactive
   }
}


const STALE = Symbol('stale')

export function createMemoizedDerivation(
   derive: (prev?: unknown) => unknown,
   setup?: AnyObject,
   retrack: boolean = true,
) {
   const previous = new SimpleState(undefined)
   const state = new SimpleState(STALE)

   const quark = new DerivationIonQuark(() => {
      return derive(previous.get())
   }, retrack, undefined)

   let trackCall = () => {
      // initial call
      const value = trackedCall()
      quark.linkReaction(new Reaction(() => {
         if (state.get() !== STALE) previous.set(state.get())
         state.set(STALE);
      }, SYNC))
      // subsequent calls
      trackCall = trackedCall
      return value
   }

   function trackedCall() {
      return quark.trackedCall()
   }

   function $derivedState() {
      track(quark)
      if (state.get() === STALE) {
         return state.set(trackCall())
      }
      return state.get();
      // FIX: state is inaccurate when mouse starts hovering and updates are queued/cancelled, 
      // b/c resetting this.pending with this.current is not accurate anymore
   }


  //  $derivedState['~ion'] = true as const;
   $derivedState[QUARK] = quark
   if (__DEV__) quark.asTraceable = new Traceable(setup?.devName)

   if (setup) {
      const onSet = setup['@set']
      const onGet = setup['@get']
      if (onSet || onGet)
         Object.defineProperty($derivedState, 'value', {
            set: onSet,
            get: onGet,
         })
   }

   if (setup) {
      const descriptors = Object.getOwnPropertyDescriptors(setup)
      if (__DEV__ && !isPlainObject(setup)) throw new Error('additional ion props and methods must be defined in an object literal') // TODO: allow classes and prototypes?
      if (__DEV__ && 'value' in descriptors) throw new Error('Overriding .value property disallowed. Use @get and @set hooks to add behavior')
      // TODO: this was copy pasted from atomic ion, fix any inconsistencies
      delete descriptors['@get'];
      delete descriptors['@set'];
      delete descriptors['@init'];
      Object.defineProperties($derivedState, descriptors)
   }

   return $derivedState
}


// TODO: We need state that doesn't lock state to updates, 
// otherwise derivations that use state from different updates
// will overload the system with update cancellations from race conditions.
//
// The following solution seems to work decently, but it's not fully robust.
// It appears that once updates get cancelled and requeued and causes a cascade of requeuing,
// the memoized state can get outdated (outdated state gets rendered, which we absolutely cannot allow) 
// We need to either prevent cascading race conditions
// or write a more robust solution. 

class MemoizedState extends SimpleState {

   constructor(private state: unknown, private derive: Function) {
      super(state)
   }

   get() {
      if (this.pendingUpdate) {
         return this.pending;
      }
      return this.current
   }

   override lock() {
      const update = $activeUpdate()
      // if (!update) {
      //    console.error('nothing to lock to')
      //    return;
      // }
      // if (update.cancelled) console.warn('DEV RESEARCH: state is being accessed after update cancelled...')
      // if (update.committed) {
      //    return;
      // }
      update.race(this.pendingUpdate, this.derive, this.state)
      this.pendingUpdate = update // NOTE: It's important to do this even for race conditions, otherwise state becomes inaccurate
      update.atComplete(() => {
         this.pendingUpdate = null
      })
      if (update.committed) {
         update.atComplete(() => {
            this.commitUpdate()
         })
      }
      else
         queueCommit(update, this)
   }
}
