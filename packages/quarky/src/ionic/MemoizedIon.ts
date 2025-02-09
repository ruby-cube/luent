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
   [QUARKS]: MemoizedIon
}
type MemoizedCompound = IonicCompound<MemoizedIon> & {state: unknown}

/** 
 * INTERNAL 
 * */
export type MemoizedIon =
   Quarks<$MemoizedIon>
   & Watchable
   & CapsuleQuarks
   & MaybeParticle
   & MaybeCompound<MemoizedCompound>

export const MEMOIZED_ION = Symbol('Memoized Ion')

export function isMemoizedIon(value: unknown): value is $MemoizedIon {
   return hasQuarks(value) && quarksOf(value).type === MEMOIZED_ION
}

export function createMemoizedIon(
   derivation: (previousValue?: unknown) => unknown,
   methods?: AnyObject,
   retrack: boolean = true
) {
   const creationFlask = getActiveFlask()

   const $memoizedIon = () => {
      if (__DEV__) emitSignal();
      getActiveTracker()?.track(ion)

      const initialized = !!compound.particles;
      if (!initialized) {
         const flask = getActiveFlask()
         assertValidInitialization(flask, creationFlask) // prevents memory leaks caused by usng memoized ion outside of its creation scope
         flask?.onDiscard(() => {
            compound.untrackParticles()
         })
      }
      const value = !initialized ? compound.trackedCall(derivation)
         : (retrack && compound.dirty) ? compound.trackedCall(() => derivation(compound.state))
            : compound.dirty ? derivation(compound.state)
               : compound.state;

      if (!initialized || compound.dirty)
         compound.state = value;
      compound.dirty = false;
      return value;
   }

   const ion: MemoizedIon = {
      entity: $memoizedIon,
      type: MEMOIZED_ION,
      asParticle: undefined,
      asCompound: undefined,
      __DEV__asTraceable: undefined,
      asReadonly: undefined,
      asReined: undefined,
      asWatched: undefined
   }

   const compound = ion.asCompound = new IonicCompound(ion) as MemoizedCompound
   compound.trigger = trigger

   $memoizedIon[QUARKS] = ion
   $memoizedIon.__DEV__labelName = undefined
   $memoizedIon.__DEV__label = __DEV__label

   __DEV__initTraceability(ion)

   if (methods) {
      attachCapsuleMethods('MemoizedDerivationIon', $memoizedIon, methods)
   }

   return $memoizedIon;
}

function trigger(this: IonicCompound<MemoizedIon>, mutation: Mutation): void {
   this.dirty = true;
   this.quarks.asParticle?.triggerCompounds(mutation)
   triggerEffects(this, mutation)
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
