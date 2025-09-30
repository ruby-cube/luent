import { AtomicQuark } from "../ion/AtomicIon";
import { ModelQuark } from "./ModelQuark";

// export class AtomicOp implements Quark, Watchable {
//    quarkType: string | symbol = 'atomic op'
//    __DEV__asTraceable: Traceable;
//    asWatchedAtom: WatchedAtom | undefined;
//    trigger = trigger

//    constructor(
//       public model: IonizedModel,
//       public op: PropertyKey,
//       public entryKey: any,
//    ) {
//       quarkOf(model).registerOp(op, entryKey, this)

//       this.__DEV__asTraceable = quarkOf(this.model).__DEV__asTraceable
//    }
//    pendingUpdate: Update | null = null

//    entity = undefined

//    // discard() {
//    //    unregisterAtomicOp(this.trackableOp, this.entryKey)
//    // }

//    // getOutput() {
//    //    return this.modelQuark.rawTarget[this.op](this.entryKey)
//    // }
// }


// export function isTrackedOp(value: any): value is AtomicOp {
//    if (!(value instanceof Object)) return false;
//    return value instanceof AtomicOp;
// }

export function asAtomicOp(
   quark: ModelQuark,
   op: PropertyKey,
   key: any
): AtomicQuark {
   if (__DEV__) return $atomicOp(quark, op, key) ?? quark.registerOp(op, key, __DEV__createAtomicOp(quark, op, key))
   return $atomicOp(quark, op, key) ?? quark.registerOp(op, key, new AtomicQuark())
}

function __DEV__createAtomicOp(
   modelQuark: ModelQuark,
   op: PropertyKey,
   key: any) {
   const opQuark = new AtomicQuark();
   //@ts-expect-error
   opQuark.__DEV__atomicOp = {
      modelQuark,
      op,
      key
   }
   //@ts-expect-error
   opQuark.__DEV__asTraceable = modelQuark.__DEV__asTraceable;
   return opQuark;
}

export type TrackedOps = Map<EntryKey, AtomicQuark>
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
   quark: ModelQuark,
   op: PropertyKey,
   entryKey: EntryKey
) {
   return getAtomicOps(quark, op)?.get(entryKey)
}

export function getAtomicOps(
   quark: ModelQuark,
   op: PropertyKey
) {
   const atomicOps = quark.trackedOps[op]
   if (!(atomicOps instanceof Map)) return undefined;
   return atomicOps;
}

