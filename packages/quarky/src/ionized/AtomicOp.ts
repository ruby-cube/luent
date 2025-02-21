import { asParticle, ParticleMorph, Particle } from "../compound/Particle";
import { Traceable } from "../debug/Traceable";
import { Quark, quarkOf } from "../Quark";
import { IonizedModel } from "./IonizedModel";
import { noop } from "@rue/utils";

export class AtomicOp implements Quark, ParticleMorph {
   type: string | symbol = 'atomic op'
   asParticle!: Particle
   trackableOp: Function & TrackableOp;
   asTraceable: Traceable;

   constructor(
      public model: IonizedModel,
      public op: string,
      public entryKey: any,
   ) {
      const trackableOp = this.trackableOp = model[op]
      registerAtomicOp(trackableOp, entryKey, this)
      // const modelQuark = quarkOf(model);
      // modelQuark.addObservedEntryKey(entryKey)
      const particle = this.asParticle = asParticle(this);
      particle.onDissociated(() => {
         if (particle.compounds.size === 0) {
            // modelQuark.deleteObservedEntryKey(entryKey)
            this.discard()
         }
      })
      
      this.asTraceable = quarkOf(this.model).asTraceable
   }
   entity = noop;

   discard() {
      unregisterAtomicOp(this.trackableOp, this.entryKey)
   }

   // getOutput() {
   //    return this.modelQuark.rawTarget[this.op](this.entryKey)
   // }

   trigger() {
      this.asParticle.triggerCompounds()
   }
}


// export function isTrackedOp(value: any): value is AtomicOp {
//    if (!(value instanceof Object)) return false;
//    return value instanceof AtomicOp;
// }

export function asAtomicOp(
   model: IonizedModel,
   op: string,
   key: any
): AtomicOp {
   const atomicOp = getAtomicOp(model[op], key)
   if (atomicOp) return atomicOp;
   return new AtomicOp(model, op, key)
}

type TrackableOp = { [TRACKED]?: Map<EntryKey, AtomicOp> | undefined }
type EntryKey = any
export const TRACKED = Symbol('tracked atomic ops')

export function registerAtomicOp(
   op: Function & TrackableOp,
   entryKey: EntryKey,
   atomicOp: AtomicOp
) {
   op[TRACKED]?.set(entryKey, atomicOp) ?? (op[TRACKED] = new Map([[entryKey, atomicOp]]))
}

export function unregisterAtomicOp(
   op: Function & TrackableOp,
   entryKey: EntryKey
) {
   const trackedOps = op[TRACKED]
   trackedOps?.delete(entryKey)
}

export function getAtomicOp(
   op: Function & TrackableOp,
   entryKey: EntryKey
) {
   return op[TRACKED]?.get(entryKey)
}

export function getAtomicOps(
   op: Function & TrackableOp
) {
   return op[TRACKED]
}

