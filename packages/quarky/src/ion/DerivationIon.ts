import { Effect } from "../reactivity/EffectQueue";
import { FunctionalSubstance } from "../reactivity/Substance";
import { hasQuark, QUARK, quarkOf } from "../abstract/Quark";
import { AnyObject } from "@rue/types";
import { Traceable } from "../debug/Traceable";
import { SYNC } from "../reactivity/RenderCycle";
import { $activeUpdate } from "../reactivity/Update";
import { track } from "../reactivity/Compound";
import { queueCommit, SimpleState } from "../reactivity/State";


class DerivationIonQuark {
   __DEV__asTraceable = new Traceable()
   quarkType = DERIVATION_ION

   constructor(
      private substance: FunctionalSubstance
   ) { }

   get inert() {
      return !this.substance.reactive
   }
}

export const DERIVATION_ION = Symbol('Derivation Ion')

export function isManagedDerivation(value: unknown) {
   return hasQuark(value) && quarkOf(value).quarkType === DERIVATION_ION
}



export function createMemoizedDerivation(
   derive: (prev?: unknown) => unknown,
   methods?: AnyObject, // TODO:
   retrack: boolean = true,
) {
   const isStale = new MemoizedState(true, derive)
   const state = new MemoizedState(undefined, derive)

   const substance = new FunctionalSubstance(() => {
      return derive(state.get())
   }, retrack)

   let trackCall = () => {
      // initial call
      const value = trackedCall()
      substance.linkEffect(new Effect(() => {
         isStale.set(true);
      }, SYNC))
      // subsequent calls
      trackCall = trackedCall
      return value
   }

   function trackedCall() {
      const value = state.set(substance.trackedCall())
      if (substance.reactive) {
         isStale.set(false)
      }
      return value
   }

   function $derivedState() {
      track(substance)
      if (isStale.get()) {
         return trackCall()
      }
      return state.get();
      // FIX: state is inaccurate when mouse starts hovering and updates are queued/cancelled, 
      // b/c resetting this.pending with this.current is not accurate anymore
   }

   $derivedState['~ion'] = true as const;
   $derivedState[QUARK] = new DerivationIonQuark(substance)

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

   override lock() {
      const update = $activeUpdate()
      if (!update) {
         console.warn('nothing to lock to')
         return;
      }
      // if (update.cancelled) console.warn('DEV RESEARCH: state is being accessed after update cancelled...')
      if (update.committed) return;
      update.race(this.pendingUpdate, this.derive, this.state)
      if (this.pendingUpdate === null){
         this.pendingUpdate = update
         update.atCommit(() => {
            this.pendingUpdate = null
         })
      }
      queueCommit(update, this)
   }
}
