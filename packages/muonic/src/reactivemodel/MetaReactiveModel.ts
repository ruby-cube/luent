import type { AnyObject } from "@rue/types"
import type { ReactiveModel, ReactiveTraps } from "./ReactiveModel"
import type { TrackedOp } from "./TrackedOp"
import type { ReactiveEntity } from "../ReactiveEntity"




type OpMap = Map<EntryKey, TrackedOp>
type OpName = string
type EntryKey = any

export const REACTIVE_MODEL = Symbol('reactiveModel')

export class MetaReactiveModel<T extends AnyObject = AnyObject> implements ReactiveEntity {
    deepReactive?: ReactiveModel<T>
    shallowReactive?: ReactiveModel<T>
    readonly type = REACTIVE_MODEL

    initDeepReactive(reactiveModel: ReactiveModel) {
        if (this.deepReactive) return;
        this.deepReactive = reactiveModel as ReactiveModel<T>;
    }

    initShallowReactive(reactiveModel: ReactiveModel) {
        if (this.deepReactive) return;
        this.deepReactive = reactiveModel as ReactiveModel<T>;
    }

    constructor(
        public rawTarget: T,
        public traps?: ReactiveTraps<T>
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



export type Collection<K = any, V = any> = Set<K> | Array<K> | Map<K, V>

export class MetaReactiveCollection<T extends Collection = Collection> extends MetaReactiveModel<T> {
    constructor(rawTarget: T, traps: ReactiveTraps) {
        super(rawTarget, traps)
    }

    observedEntryKeys = new Set()

    addObservedEntryKey(entryKey: any) {
        this.observedEntryKeys.add(entryKey)
    }

    deleteObservedEntryKey(entryKey: any) {
        this.observedEntryKeys.delete(entryKey)
    }
}

export function isCollection(target: unknown): target is Collection {
    return target instanceof Array || target instanceof Set || target instanceof Map
}