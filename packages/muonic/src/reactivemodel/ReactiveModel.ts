import { AnyObject } from "@rue/types";
import { ObservedProp } from "./ObservedProp";
import { TrackedOp } from "./TrackedOp";
import { META, ReactiveEntity } from "../ReactiveEntity";
import type { ReactiveModel } from "./Reactive$";

type OpMap = Map<EntryKey, TrackedOp>
type OpName = string
type EntryKey = any

export const REACTIVE_MODEL = Symbol('reactiveModel')


export class MetaReactiveModel<T extends AnyObject = AnyObject> implements ReactiveEntity {
    o!: ReactiveModel<T>
    readonly type = REACTIVE_MODEL

    initReactiveModel(reactiveModel: ReactiveModel) {
        if (this.o) return;
        this.o = reactiveModel as ReactiveModel<T>;
    }

    constructor(
        public rawTarget: T,
        public deep: boolean
    ) { }

    // observedProps: Map<PropertyKey, ObservedProp> = new Map()

    // registerObservedProp(key: PropertyKey, prop: ObservedProp) {
    //     this.observedProps.set(key, prop)
    // }

    // unregisterObservedProp(key: PropertyKey) {
    //     this.observedProps.delete(key)
    // }

    // getObservedProp(key: PropertyKey) {
    //     return this.observedProps.get(key)
    // }

    // trackedOps: Map<OpName, OpMap> = new Map()

    // registerTrackedOp(op: OpName, entryKey: EntryKey, trackedOp: TrackedOp) {
    //     let opMap = this.trackedOps.get(op);
    //     if (!opMap) {
    //         opMap = new Map();
    //         this.trackedOps.set(op, opMap)
    //     }
    //     opMap.set(entryKey, trackedOp)
    // }

    // unregisterTrackedOp(op: OpName, entryKey: EntryKey) {
    //     const opMap = this.trackedOps.get(op)
    //     opMap?.delete(entryKey)
    //     if (opMap?.size === 0) {
    //         this.trackedOps.delete(op)
    //     }
    // }

    // getTrackedOp(op: OpName, entryKey: EntryKey) {
    //     return this.trackedOps.get(op)?.get(entryKey)
    // }
}




