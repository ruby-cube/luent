import { AnyObject } from "@rue/types";
import { Particle, ParticleMorph } from "../compound/Particle";
import { Watchable } from "../reactivity/Watched";
import { emitSignal } from "../debug/debug";
import { getActiveTracker } from "../ionic/IonicCompound";

export type Atomic = ParticleMorph & Watchable


export function getAtomicState(target: AnyObject, key: PropertyKey, particle: ParticleMorph) {
   if (__DEV__) emitSignal();
   getActiveTracker()?.track(particle)
   return target[key];
}


// export function setAtomicState(
//    mutable: MutableEntity,
//    rawTarget: AnyObject, //FIX: This needs to be the raw target,
//    key: PropertyKey,
//    oldState: unknown,
//    newState: unknown,
//    quark: Atomic | undefined,
// ) {
//    rawTarget[key] = newState; // must set state before triggering effects and derivations
//    const mutation = new Mutation(
//       mutable, //FIX: this needs to be the ionized model and $state
//       '[[set]]',
//       [key, newState],
//       newState,
//       oldState
//    )
//    trigger(quark, mutation)
//    return mutation
// }



