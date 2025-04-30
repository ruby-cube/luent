import { asParticle, ParticleMorph, Particle } from "../compound/Particle";
import { Traceable } from "../debug/Traceable";
import { isIon } from "../ion/Ion";
import { Quark, quarkOf } from "../Quark";
import { isIonizedModel } from "./ionize";
import { IonizedModel } from "./IonizedModel";
import { noop } from "@rue/utils";

export class AtomicOp implements Quark, ParticleMorph {
   type: string | symbol = 'atomic op'
   asParticle!: Particle
   asTraceable: Traceable;

   constructor(
      public model: IonizedModel,
      public op: PropertyKey,
      public entryKey: any,
   ) {
      quarkOf(model).registerOp(op, entryKey, this)
      // const particle = this.asParticle = asParticle(this);
      // particle.onDissociated(() => {
      //    if (particle.compounds.size === 0) {
      //       this.discard()
      //    }
      // })

      this.asTraceable = quarkOf(this.model).asTraceable
   }
   entity = noop;

   // discard() {
   //    unregisterAtomicOp(this.trackableOp, this.entryKey)
   // }

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
   op: PropertyKey,
   key: any
): AtomicOp {
   return getAtomicOp(model, op, key) ?? new AtomicOp(model, op, key)
}

export type TrackedOps = Map<EntryKey, AtomicOp>
type EntryKey = any

// export function registerAtomicOp(
//    model: IonizedModel,
//    entryKey: EntryKey,
//    atomicOp: AtomicOp
// ) {
//    quarkOf(model).pions.set((entryKey, atomicOp)
// }

// export function unregisterAtomicOp(
//    model: IonizedModel,
//    op: PropertyKey,
//    entryKey: EntryKey
// ) {
//    getAtomicOps(model, op)?.delete(entryKey)
// }

export function getAtomicOp(
   model: IonizedModel,
   op: PropertyKey,
   entryKey: EntryKey
) {
   return getAtomicOps(model, op)?.get(entryKey)
}

export function getAtomicOps(
   model: IonizedModel,
   op: PropertyKey
) {
   const atomicOps = quarkOf(model).pions.get(op)
   if (!(atomicOps instanceof Map)) return undefined;
   return atomicOps;
}

