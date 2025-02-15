import { getActiveTracker, IonicCompound, IonicCompoundMorph } from "./IonicCompound";
import { AnyObject } from "@rue/types";
import { Flask, getActiveFlask } from "@rue/flask";
import { quarkOf, QUARK, hasQuark, EntityQuark, QuarkOf, Quark } from "../Quark";
import { __DEV__initTraceability, attachCapsuleMethods, Capsule } from "../capsule/Capsule";
import { ParticleMorph } from "../compound/Particle";
import { __DEV__label } from "../debug/DEVLabellable";
import { emitSignal, Traceable } from "../debug/debug";
import { unwatch, watch, Watchable, Watched } from "../watch/Watched";
import { Ion, NonVoid } from "../ion/ion";
import { CompoundMorph, triggerEffects } from "../compound/Compound";
import { Mutation } from "../mutation/Mutable";

/**
* Managed Derivation Ion
* - memoization **
* ---retracking
* - provide previous state to derivation
* - encapsulates with methods
* ---- manage dev traces through quarky capsule **
**/

// /** INTERNAL */
export type $DerivedState = Ion & Capsule & {
   [QUARK]: {
      type: symbol
      inert: boolean
      state: NonVoid
      dirty:boolean
   }
   & EntityQuark<$DerivedState>
   & Watchable
   & ParticleMorph
   & IonicCompoundMorph
}

/** 
 * INTERNAL 
 * */
export type ManagedDerivation = QuarkOf<$DerivedState>

export const DERIVATION_ION = Symbol('Derivation Ion')

export function isManagedDerivation(value: unknown): value is $DerivedState {
   return hasQuark(value) && quarkOf(<$DerivedState>value).type === DERIVATION_ION
}

export function createMaybeMemoizedIon(
   derivation: (previousValue?: NonVoid) => NonVoid,
   methods?: AnyObject,
   retrack: boolean = true,
   quark?: ManagedDerivation,
) {
   const creationFlask = getActiveFlask()

   let compound: IonicCompound | undefined
   let fn = initialize
   const $derived = () => fn()

   function initialize() {
      compound = new IonicCompound(ion)
      const value = compound.trackedCall(derivation)
      if (compound.particles.length === 0) {
         fn = getState
         ion.inert = true;
         // no reactivity, no memoization
         compound = undefined;
         return value;
      }
      else {
         if (__DEV__) emitSignal();
         getActiveTracker()?.track(ion)
         fn = getMemoizedState
         ion.state = value;
         ion.asCompound = compound
         compound.trigger = trigger
         const flask = getActiveFlask()
         assertValidInitialization(flask, creationFlask) // prevents memory leaks caused by usng memoized ion outside of its creation scope
         flask?.onDiscard(() => {
            compound!.untrackParticles()
         })
         return value;
      }
   }

   function getMemoizedState() {
      getActiveTracker()?.track(ion)
      const compound = ion.asCompound!
      const value =
         (retrack && ion.dirty) ? compound.trackedCall(() => derivation(ion.state))
            : ion.dirty ? derivation(ion.state)
               : ion.state;

      if (ion.dirty) {
         ion.state = value;
         ion.dirty = false;
      }
      return value;
   }

   function getState() {
      return ion.state = derivation(ion.state)
   }

   const ion: ManagedDerivation = quark ?? {
      inert: false,
      dirty: false,
      state: undefined,
      entity: $derived,
      type: DERIVATION_ION,
      asParticle: undefined,
      asCompound: undefined,
      asWatched: undefined,
      __DEV__asTraceable: new Traceable(),
      watch,
      unwatch: () => unwatch.call(ion)
   }

   $derived[QUARK] = ion
   $derived.__DEV__labelName = undefined
   $derived.__DEV__label = __DEV__label


   if (methods) {
      attachCapsuleMethods('MemoizedDerivationIon', $derived, methods)
   }

   return $derived;
}




function trigger(this: IonicCompound<ManagedDerivation>, mutation: Mutation): void {
   this.quark.dirty = true;
   this.quark.asParticle?.triggerCompounds(mutation)
   triggerEffects(this)
}

/* Not sure if this is correct. 
Memory leaks occur when an object is referenced outside of its creation scope in a way that does not reassign it with the new version of the object, ie collecting it in an array, map, or set.
*/
function assertValidInitialization(initializationFlask: Flask | undefined, creationFlask: Flask | undefined) {
   if (!creationFlask) return;
   if (!initializationFlask) {
      if (creationFlask.creationScopeID === "0") // both are in global creation scope
         return;
      throw new Error("Memory leak alert. A memoized ion cannot be called outside its creation scope.")
   }
   if (initializationFlask.creationScopeID === creationFlask.creationScopeID) return;
   if (!flaskAContainsFlaskB(creationFlask, initializationFlask))
      throw new Error("Memory leak alert. A memoized ion cannot be called outside its creation scope.")
}

function flaskAContainsFlaskB(flaskA: Flask, flaskB: Flask) {
   let outer = flaskB.outer
   do {
      if (outer === flaskA)
         return true;
      outer = outer?.outer;
   }
   while (outer)
   return false;
}
