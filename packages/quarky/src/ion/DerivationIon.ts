import { Effect } from "../reactivity/EffectQueue";
import { FunctionalSubstance } from "../reactivity/Substance";
import { hasQuark, QUARK, quarkOf } from "../abstract/Quark";
import { AnyObject } from "@rue/types";
import { Traceable } from "../debug/Traceable";
import { SYNC } from "../reactivity/RenderCycle";
import { $activeUpdate } from "../reactivity/Update";
import { track } from "../reactivity/Compound";
import { queueCommit, SimpleState } from "../reactivity/State";
import { isPlainObject } from "@rue/utils";


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

const STALE = Symbol('stale')

export function createMemoizedDerivation(
   derive: (prev?: unknown) => unknown,
   methods?: AnyObject, // TODO:
   retrack: boolean = true,
) {
   const state = new SimpleState(STALE) // FIX: ?

   const substance = new FunctionalSubstance(() => {
      return derive(state.current === STALE ? state.previous : state.current) // FIX: figure out how to store previous state
   }, retrack, undefined, methods?.['#logAtoms'])

   let trackCall = () => {
      // initial call
      const value = trackedCall()
      substance.linkEffect(new Effect(() => {
         state.previous = state.current === STALE ? state.previous : state.current
         state.set(STALE);
      }, SYNC))
      // subsequent calls
      trackCall = trackedCall
      return value
   }

   function trackedCall() {
      return substance.trackedCall()
   }

   function $derivedState() {
      track(substance)
      if (state.get() === STALE) {
         return state.set(trackCall())
      }
      return state.get();
      // FIX: state is inaccurate when mouse starts hovering and updates are queued/cancelled, 
      // b/c resetting this.pending with this.current is not accurate anymore
   }



   $derivedState['~ion'] = true as const;
   $derivedState[QUARK] = new DerivationIonQuark(substance)

   if (methods) {
      const onSet = methods['@set']
      const onGet = methods['@get']
      if (onSet || onGet)
         Object.defineProperty($derivedState, 'value', {
            set: onSet,
            get: onGet,
         })
   }

   if (methods) {
      const descriptors = Object.getOwnPropertyDescriptors(methods)
      if (__DEV__ && !isPlainObject(methods)) throw new Error('additional ion props and methods must be defined in an object literal') // TODO: allow classes and prototypes?
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
      if (!update) {
         console.warn('nothing to lock to')
         return;
      }
      // if (update.cancelled) console.warn('DEV RESEARCH: state is being accessed after update cancelled...')
      if (update.committed) return;
      update.race(this.pendingUpdate, this.derive, this.state)
      this.pendingUpdate = update // NOTE: It's important to do this even for race conditions, otherwise state becomes inaccurate
      update.atCommit(() => {
         this.pendingUpdate = null
      })
      queueCommit(update, this)
   }
}
