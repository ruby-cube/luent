import { debug } from "@rue/utils";
import { Quark } from "../abstract/Quark";
import { Traceable } from "../debug/Traceable";
import { Atom, TrackedAtom } from "../reactivity/Atom";
import { ModelQuark } from "./ModelQuark";

// a `trackable op` is a method like 'filter' that tracks the entire ionic model rather than a specific property

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

   private tracked: Map<PropertyKey, Tracked>

   constructor(
      private modelQuark: ModelQuark
   ) {

      this.tracked = new Map([['[[in]]', new Map()]])
   }


   private register(op: PropertyKey, key: any, trackedOp: TrackedOpQuark) {
      const ops = this.tracked.get(op) ?? new Map();
      if (!(ops instanceof Map)) {
         debug.error(`${String(op)} is not an op`)
         return trackedOp;
      }
      this.tracked.set(op, ops);
      ops.set(key, trackedOp)
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
      key: EntryKey
   ) {
      return this.getAllTracked(op)?.get(key)
   }

   getAllTracked(
      op: PropertyKey
   ) {
      const atomicOps = this.tracked.get(op)
      if (!(atomicOps instanceof Map)) return undefined;
      return atomicOps;
   }

}