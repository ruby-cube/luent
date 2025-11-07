import { Quark } from "../abstract/Quark";
import { Traceable } from "../debug/Traceable";
import { Atom, TrackedAtom, trigger } from "../reactivity/Atom";
import { ILazyState } from "../reactivity/State";
import { Update } from "../reactivity/UpdateCycle";
import { ModelQuark } from "./ModelQuark";

export type TrackedOps = Map<EntryKey, Atom>

type EntryKey = any

/**
 * Returns atomic op if it exists, otherwise creates a new atomic op 
 * @param quark 
 * @param op 
 * @param key 
 * @returns 
 */
export function asAtomicOp(
   quark: ModelQuark,
   op: PropertyKey,
   key: EntryKey
): Atom {
   return getAtomicOp(quark, op, key) ?? quark.registerOp(op, key, new AtomicOpQuark(quark, op, key))
}

const ATOMIC_ACCESSOR = Symbol('atomic op')

export class AtomicOpQuark implements Atom, Quark {
   constructor(
      public modelQuark: ModelQuark,
      public op: PropertyKey,
      public key: EntryKey
   ) {
      this.__DEV__asTraceable = modelQuark.__DEV__asTraceable
   }
   quarkType: string | symbol = ATOMIC_ACCESSOR
   asTrackedAtom: TrackedAtom | undefined;
   trigger: (update: Update) => void = trigger

   public __DEV__asTraceable: Traceable

} 


export function getAtomicOp(
   quark: ModelQuark,
   op: PropertyKey,
   entryKey: EntryKey
) {
   return getTrackedOps(quark, op)?.get(entryKey)
}


export function getTrackedOps(
   quark: ModelQuark,
   op: PropertyKey
) {
   const atomicOps = quark.trackedOps[op]
   if (!(atomicOps instanceof Map)) return undefined;
   return atomicOps;
}






// export class AtomicOp implements Quark, Atom {
//    quarkType: string | symbol = 'atomic op'
//    __DEV__asTraceable: Traceable;
//    asTrackedAtom: TrackedAtom | undefined;
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