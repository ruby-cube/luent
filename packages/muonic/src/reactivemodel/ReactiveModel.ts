import { AnyObject } from "@rue/types";
import { ObservedProp } from "./ObservedProp";
import { TrackedOp } from "./TrackedOp";
import { unwatch, watch, Watchable } from "../effects/Watchable";
import { WatchTarget } from "../effects/WatchTarget";
import { Collection, MetaReactiveCollection } from "./ReactiveCollection";

type OpMap = Map<EntryKey, TrackedOp>
type OpName = string
type EntryKey = any


export class MetaReactiveModel<T extends AnyObject = AnyObject> implements Watchable {
    reactiveModel!: ReactiveModel<T>

    initReactiveModel(reactiveModel: ReactiveModel) {
        if (this.reactiveModel) return;
        this.reactiveModel = reactiveModel as ReactiveModel<T>;
    }

    constructor(
        public rawTarget: T,
        public deep: boolean
    ) { }

    observedProps: Map<PropertyKey, ObservedProp> = new Map()

    registerObservedProp(key: PropertyKey, prop: ObservedProp) {
        this.observedProps.set(key, prop)
    }

    unregisterObservedProp(key: PropertyKey) {
        this.observedProps.delete(key)
    }

    getObservedProp(key: PropertyKey) {
        return this.observedProps.get(key)
    }

    trackedOps: Map<OpName, OpMap> = new Map()

    registerTrackedOp(op: OpName, entryKey: EntryKey, trackedOp: TrackedOp) {
        let opMap = this.trackedOps.get(op);
        if (!opMap) {
            opMap = new Map();
            this.trackedOps.set(op, opMap)
        }
        opMap.set(entryKey, trackedOp)
    }

    unregisterTrackedOp(op: OpName, entryKey: EntryKey) {
        const opMap = this.trackedOps.get(op)
        opMap?.delete(entryKey)
        if (opMap?.size === 0) {
            this.trackedOps.delete(op)
        }
    }

    getTrackedOp(op: OpName, entryKey: EntryKey) {
        return this.trackedOps.get(op)?.get(entryKey)
    }

    asWatchTarget?: WatchTarget<any> | undefined;
    watch = watch;
    unwatch = unwatch;
}

export const REACTIVE_MODEL_MARKER = Symbol('reactive model')

export type ReactiveModel<T extends AnyObject = AnyObject> = T
type MetaReactive<T extends AnyObject = AnyObject> = T extends Collection ? MetaReactiveCollection<T> : MetaReactiveModel<T>

export class ReactiveModelContainer<T extends AnyObject = AnyObject> {
    [REACTIVE_MODEL_MARKER]: MetaReactive<T>

    constructor(rawTarget: T, deep: boolean) {
        this[REACTIVE_MODEL_MARKER] = isCollection(rawTarget) ? new MetaReactiveCollection(rawTarget, deep) as MetaReactive<T>: new MetaReactiveModel(rawTarget, deep) as MetaReactive<T>
    }
}

function isCollection(target: unknown): target is Collection {
    return target instanceof Array || target instanceof Set || target instanceof Map
}