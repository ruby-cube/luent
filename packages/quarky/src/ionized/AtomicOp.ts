



import { asParticle, MaybeParticle, Particle } from "../Compound/Particle";
import { Quark, quarkOf } from "../Quark";
import { IonizedModel } from "./IonizedModel";
import { noop } from "@rue/utils";

export class TrackedOp implements Quark, MaybeParticle { //QUESTION: should this be tracked op or trackable op??  because becoming an ionic particle is the "tracked" part
   type: string | symbol = 'tracked op'
   asParticle!: Particle
   trackableOp: Function & TrackableOp;

   constructor(
      public model: IonizedModel,
      public op: string,
      public entryKey: any,
   ) {
      const trackableOp = this.trackableOp = model[op]
      registerTrackedOp(trackableOp, entryKey, this)
      const modelQuark = quarkOf(model);
      modelQuark.addObservedEntryKey(entryKey)
      const particle = this.asParticle = asParticle(this);
      particle.onDissociated(() => {
         if (particle.compounds.size === 0) {
            modelQuark.deleteObservedEntryKey(entryKey)
            this.discard()
         }
      })
   }
   entity=noop;

   discard() {
      unregisterTrackedOp(this.trackableOp, this.entryKey)
   }

   // getOutput() {
   //    return this.modelQuark.rawTarget[this.op](this.entryKey)
   // }
}


// export function isTrackedOp(value: any): value is TrackedOp {
//    if (!(value instanceof Object)) return false;
//    return value instanceof TrackedOp;
// }

export function asTrackedOp(
   model: IonizedModel,
   op: string,
   key: any
): TrackedOp {
   const trackedOp = getTrackedOp(model[op], key)
   if (trackedOp) return trackedOp;
   return new TrackedOp(model, op, key)
}

// export function getTrackedOp(
//    model: IonizedModel,
//    op: string,
//    key: any
// ) {
//    return quarkOf(model).getTrackedOp(op, key)
// }


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