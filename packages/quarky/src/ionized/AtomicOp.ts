import { Traceable } from "../debug/Traceable";
import { Update } from "../effect-cycle/ReactivitySystem";
import { Quark, quarkOf } from "../Quark";
import { trigger, Watchable, WatchedAtom } from "../watch/WatchedAtom";
import { IonizedModel } from "./IonizedModel";

export class AtomicOp implements Quark, Watchable {
   quarkType: string | symbol = 'atomic op'
   asTraceable: Traceable;
   asWatchedAtom: WatchedAtom | undefined;
   trigger = trigger

   constructor(
      public model: IonizedModel,
      public op: PropertyKey,
      public entryKey: any,
   ) {
      quarkOf(model).registerOp(op, entryKey, this)

      this.asTraceable = quarkOf(this.model).asTraceable
   }
   pendingUpdate: Update | null = null

   entity = undefined

   // discard() {
   //    unregisterAtomicOp(this.trackableOp, this.entryKey)
   // }

   // getOutput() {
   //    return this.modelQuark.rawTarget[this.op](this.entryKey)
   // }
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
   return $atomicOp(model, op, key) ?? new AtomicOp(model, op, key)
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

export function $atomicOp(
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

