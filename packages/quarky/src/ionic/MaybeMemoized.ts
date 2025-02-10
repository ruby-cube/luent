import { getActiveTracker, IonicCompound } from "./IonicCompound";
import { AnyObject } from "@rue/types";
import { Flask, getActiveFlask } from "@rue/flask";
import { quarksOf, QUARKS, Quarks, hasQuarks } from "../Quarks";
import { __DEV__initTraceability, attachCapsuleMethods, Capsule, CapsuleQuarks } from "../capsule/Capsule";
import { MaybeParticle } from "../Compound/Particle";
import { __DEV__label } from "../debug/DEVLabellable";
import { emitSignal } from "../debug/debug";
import { Watchable } from "../watch/Watched";
import { Ion } from "../ion/Ion";
import { MaybeCompound, triggerEffects } from "../Compound/Compound";
import { Mutation } from "../watch/watch";

/**
* Managed Derivation Ion
* - memoization **
* ---retracking
* - provide previous state to derivation
* - encapsulates with methods
* ---- manage dev traces through quarky capsule **
**/

// /** INTERNAL */
export type $MemoizedIon = Ion & Capsule & {
   [QUARKS]: MemoizedDerivation
}
type MemoizedCompound = IonicCompound<MemoizedDerivation>

/** 
 * INTERNAL 
 * */
export type MemoizedDerivation = { 
   state: unknown
   entity: $MemoizedIon 
} &
   Quarks
   & Watchable
   & CapsuleQuarks
   & MaybeParticle
   & MaybeCompound<MemoizedCompound>



export const MAYBE_MEMOIZED = Symbol('Maybe Memoized Ion')
export const MEMOIZED_ION = Symbol('Memoized Ion')
export const DERIVATION = Symbol('Derivation')

export function isMemoizedIon(value: unknown): value is $MemoizedIon {
   return hasQuarks(value) && quarksOf(value).type === MEMOIZED_ION
}

export function createMaybeMemoizedIon(
   derivation: (previousValue?: unknown) => unknown,
   methods?: AnyObject,
   retrack: boolean = true
) {
   const creationFlask = getActiveFlask()

   let compound: IonicCompound | undefined
   let fn = initialize
   const $maybeMemoized = () => fn()

   function initialize() {
      compound = new IonicCompound(ion)
      const value = compound.trackedCall(derivation)
      if (compound.particles.length === 0) {
         ion.type = DERIVATION;
         fn = getState
         // no reactivity, no memoization
         compound = undefined;
         return value;
      }
      else {
         ion.type = MEMOIZED_ION;
         if (__DEV__) emitSignal();
         getActiveTracker()?.track(ion)
         fn = getMemoizedState
         ion.state = value;
         ion.asCompound = compound as MemoizedCompound
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
         (retrack && compound.dirty) ? compound.trackedCall(() => derivation(ion.state))
            : compound.dirty ? derivation(ion.state)
               : ion.state;

      if (compound.dirty) {
         ion.state = value;
         compound.dirty = false;
      }
      return value;
   }

   function getState() {
      return ion.state = derivation(ion.state)
   }

   const ion: MemoizedDerivation = {
      state: undefined,
      entity: $maybeMemoized,
      type: MAYBE_MEMOIZED,
      asParticle: undefined,
      asCompound: undefined,
      __DEV__asTraceable: undefined,
      asReadonly: undefined,
      asReined: undefined,
      asWatched: undefined,
      recordOp: undefined
   }

   $maybeMemoized[QUARKS] = ion
   $maybeMemoized.__DEV__labelName = undefined
   $maybeMemoized.__DEV__label = __DEV__label

   __DEV__initTraceability(ion)

   if (methods) {
      attachCapsuleMethods('MemoizedDerivationIon', $maybeMemoized, methods)
   }

   return $maybeMemoized;
}




function trigger(this: IonicCompound<MemoizedDerivation>, mutation: Mutation): void {
   this.dirty = true;
   this.quarks.recordOp?.(mutation)
   this.quarks.asParticle?.triggerCompounds(mutation)
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
