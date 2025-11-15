import { Quark } from "../abstract/Quark";
import { Traceable } from "../debug/Traceable";
import { Atom, TrackedAtom } from "../reactivity/Atom";
import { CollectiveQuark } from "./IonicCollective";
import { ModelQuark } from "./IonicModel";

export type TrackedOps = Map<EntryKey, TrackedOpQuark>

type EntryKey = any

const ATOMIC_ACCESSOR = Symbol('atomic op')

export class TrackedOpQuark implements Atom, Quark {
   __DEV__asTraceable: Traceable
   quarkType: string | symbol = ATOMIC_ACCESSOR
   asTrackedAtom: TrackedAtom | undefined;

   constructor(
      public collectiveQuark: CollectiveQuark,
      public op: PropertyKey,
      public key: EntryKey,
   ) {
      this.__DEV__asTraceable = collectiveQuark.__DEV__asTraceable
   }
}


/**
 * Returns atomic op if it exists, otherwise creates a new atomic op 
 * @param quark 
 * @param op 
 * @param key 
 * @returns
 */
export function asTrackedOp(
   modelQuark: CollectiveQuark | ModelQuark,
   op: PropertyKey,
   key: EntryKey
): Atom {
   return getTrackedOp(modelQuark, op, key) ??
      modelQuark.registerOp(op, key,
         new TrackedOpQuark(modelQuark, op, key
            // modelQuark instanceof CollectiveQuark
               // ? modelQuark.state
               // : new PrivateState(modelQuark.target, modelQuark.clone)
         )
      )
}

export function getTrackedOp(
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