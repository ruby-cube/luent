



import { AnyObject } from "@rue/types";
import { asParticle, MaybeParticle, Particle } from "../Compound/Particle";
import { Ionized } from "./ionize";
import { Quarks, quarksOf } from "../Quarks";
import { IonizedModel } from "./IonizedModel";

export class TrackedOp implements Quarks, MaybeParticle { //QUESTION: should this be tracked op or trackable op??  because becoming an ionic particle is the "tracked" part
   type: string | symbol = 'tracked op'
   asParticle?: Particle
   trackableOp: Function & TrackableOp;

   constructor(
      public model: IonizedModel,
      public op: string,
      public entryKey: any,
   ) {
      const trackableOp = this.trackableOp = model[op]
      registerTrackedOp(trackableOp, entryKey, this)
   }

   discard() {
      unregisterTrackedOp(this.trackableOp, this.entryKey)
   }

   // getOutput() {
   //    return this.modelQuarks.rawTarget[this.op](this.entryKey)
   // }
}


// export function isTrackedOp(value: any): value is TrackedOp {
//    if (!(value instanceof Object)) return false;
//    return value instanceof TrackedOp;
// }

export function asTrackedOp(
   model: Ionized<AnyObject>,
   op: string,
   key: any
): TrackedOp {
   const trackedOp = getTrackedOp(model[op], key)
   if (trackedOp) return trackedOp;
   return createTrackedOp(model, op, key)
}

// export function getTrackedOp(
//    model: IonizedModel,
//    op: string,
//    key: any
// ) {
//    return quarksOf(model).getTrackedOp(op, key)
// }

function createTrackedOp(
   model: IonizedModel,
   op: string,
   key: any
) {
   const trackedOp = new TrackedOp(model, op, key)
   const modelQuarks = quarksOf(model);
   modelQuarks.addObservedEntryKey(key)
   const particle = asParticle(trackedOp);
   particle.onUntracked(() => {
      if (particle.compounds.size === 0) {
         modelQuarks.deleteObservedEntryKey(key)
         trackedOp.discard()
      }
   })
   return trackedOp;
}

type TrackableOp = { [TRACKED]?: Map<EntryKey, TrackedOp> | undefined }
type EntryKey = any
export const TRACKED = Symbol('tracked ops')

export function registerTrackedOp(
   op: Function & TrackableOp,
   entryKey: EntryKey,
   trackedOp: TrackedOp
) {
   op[TRACKED]?.set(entryKey, trackedOp) ?? (op[TRACKED] = new Map([[entryKey, trackedOp]]))
}

export function unregisterTrackedOp(
   op: Function & TrackableOp,
   entryKey: EntryKey
) {
   const trackedOps = op[TRACKED]
   trackedOps?.delete(entryKey)
}

export function getTrackedOp(
   op: Function & TrackableOp,
   entryKey: EntryKey
) {
   return op[TRACKED]?.get(entryKey)
}