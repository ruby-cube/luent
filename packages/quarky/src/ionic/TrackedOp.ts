import { debug } from "@luent/utils";
import { Traceable } from "../debug/Traceable";
import { Atom, TrackedAtom } from "../reactivity/Atom";
import { ModelQuark } from "./ModelQuark";

// a `trackable op` is a method like 'filter' that tracks the entire ionic model rather than a specific property

type Tracked = Map<EntryKey, TrackedOpQuark>

type EntryKey = any


export class TrackedOpQuark implements Atom {
  asTraceable?: Traceable | undefined;
  asTrackedAtom: TrackedAtom | undefined;

  constructor(
    public modelQuark: ModelQuark,
    public op: PropertyKey,
    public key: EntryKey,
  ) {
  }
  getState(): unknown {
    return this.modelQuark.getState()[this.op](this.key)
  }
}

function toString(value: any) {
  if (typeof value === 'symbol') return value.description
  if (typeof value === 'object') return JSON.stringify(value)
  return value.toString()
}

export class TrackedOps {

  private tracked: Map<PropertyKey, Tracked>

  constructor(
    private modelQuark: ModelQuark
  ) {

    this.tracked = new Map([['[[in]]', new Map()]])
  }


  private register(op: PropertyKey, key: any, trackedOp: TrackedOpQuark) {
    if (__DEV__) {
      const traceableModel = this.modelQuark.asTraceable!
      trackedOp.asTraceable = new Traceable(traceableModel.name + ' ' + toString(op) + toString(key), traceableModel.origin)
    }
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