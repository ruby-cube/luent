import { debug } from "@rue/utils";
import { Quark } from "../abstract/Quark";
import { Traceable } from "../debug/Traceable";
import { Atom, TrackedAtom } from "../reactivity/Atom";
import { ModelQuark } from "./IonicModel";

type Tracked = Map<EntryKey, TrackedOpQuark>

type EntryKey = any

const ATOMIC_ACCESSOR = Symbol('atomic op')

export class TrackedOpQuark implements Atom, Quark {
   __DEV__asTraceable: Traceable
   quarkType: string | symbol = ATOMIC_ACCESSOR
   asTrackedAtom: TrackedAtom | undefined;

   constructor(
      public modelQuark: ModelQuark,
      public op: PropertyKey,
      public key: EntryKey,
   ) {
      this.__DEV__asTraceable = modelQuark.__DEV__asTraceable
   }
}


export class TrackedOps {

   private tracked: Record<PropertyKey, Tracked>

   constructor(
      private modelQuark: ModelQuark
   ) {

      this.tracked = Object.create(modelQuark.target, {
         '[[in]]': { value: new Map() }
      })
   }

   private register(key: PropertyKey, entryKey: any, trackedOp: TrackedOpQuark) {
      const ops = this.tracked[key] ?? new Map();
      if (!(ops instanceof Map)) {
         debug.error(`${String(key)} is not an op`)
         return trackedOp;
      }
      this.tracked[key] = ops;
      ops.set(entryKey, trackedOp)
      return trackedOp;
   }

   asTracked(
      op: PropertyKey,
      key: EntryKey
   ): Atom {
      return this.getTracked(op, key) ??
         this.register(op, key, new TrackedOpQuark(this.modelQuark, op, key))
   }

   getTracked(
      op: PropertyKey,
      entryKey: EntryKey
   ) {
      return this.getAllTracked(op)?.get(entryKey)
   }

   getAllTracked(
      op: PropertyKey
   ) {
      const atomicOps = this.tracked[op]
      if (!(atomicOps instanceof Map)) return undefined;
      return atomicOps;
   }

}