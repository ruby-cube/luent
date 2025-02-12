import { AnyObject } from "@rue/types";
import { Mutable, Mutation } from "../actions/Mutable";
import { MaybeParticle } from "../Compound/Particle";
import { Watchable } from "../watch/Watched";
import { emitSignal } from "../debug/debug";
import { getActiveTracker } from "../ionic/IonicCompound";

export type Atomic = MaybeParticle & Watchable & Mutable

export function getAtomicState(target: AnyObject, key: PropertyKey, particle: MaybeParticle) {
   if (__DEV__) emitSignal();
   getActiveTracker()?.track(particle)
   return target[key];
}


export function setAtomicState(target: AnyObject, key: PropertyKey, quark: Atomic, oldState: unknown, newState: unknown) {
   target[key] = newState; // must set state before triggering effects and derivations
   const { recordOp, asParticle, asWatched } = quark
   const mutation = recordOp || asParticle ? new Mutation(
      target,
      '[[set]]',
      [key, newState],
      newState,
      oldState
   ) : undefined
   recordOp?.(mutation!)
   asParticle?.triggerCompounds(mutation!)
   asWatched?.triggerEffects()
   return newState;
}