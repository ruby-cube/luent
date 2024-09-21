import type { AnyObject } from "@rue/types"
import type { ReactiveModel, ReactiveTraps } from "./ReactiveModel"
import type { TrackedOp } from "./TrackedOp"
import type { ReactiveEntity } from "../ReactiveEntity"
import { ObservedProp } from "./ObservedProp"
import { PropIon } from "./PropIon"
import { DerivedIon } from "../derivations/DerivedIon"




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

    observedProps?: Map<PropertyKey, ObservedProp>

    registerObservedProp(key: PropertyKey, prop: ObservedProp) {
        if (!this.observedProps) this.observedProps = new Map()
        this.observedProps.set(key, prop)
    }

    unregisterObservedProp(key: PropertyKey) {
        if (!this.observedProps) return;
        this.observedProps.delete(key)
    }

    getObservedProp(key: PropertyKey) {
        if (!this.observedProps) return;
        return this.observedProps.get(key)
    }



    propIons?: Map<PropertyKey, PropIon>

    registerPropIon(key: PropertyKey, ion: PropIon) {
        if (!this.propIons) this.propIons = new Map()
        this.propIons.set(key, ion)
    }

    unregisterPropIon(key: PropertyKey) { //QUESTION: When to unregister?  when watchcount === 0 and observedProps atom size === 0?
        if (!this.propIons) return;
        this.propIons.delete(key)
    }

    getPropIon(key: PropertyKey) {
        if (!this.propIons) return;
        return this.propIons.get(key)
    }


    multiPropIons?: Map<string, DerivedIon>

    registerMultiPropIon(key: string, ion: DerivedIon) {
        if (!this.multiPropIons) this.multiPropIons = new Map()
        this.multiPropIons.set(key, ion)
    }

    unregisterMultiPropIon(key: string) { //QUESTION: When to unregister?
        if (!this.multiPropIons) return;
        this.multiPropIons.delete(key)
    }

    getMultiPropIon(key: string) {
        if (!this.multiPropIons) return;
        return this.multiPropIons.get(key)
    }



    trackedOps?: Map<OpName, OpMap>

    registerTrackedOp(op: OpName, entryKey: EntryKey, trackedOp: TrackedOp) {
        if (!this.trackedOps) this.trackedOps = new Map()
        let opMap = this.trackedOps.get(op);
        if (!opMap) {
            opMap = new Map();
            this.trackedOps.set(op, opMap)
        }
        opMap.set(entryKey, trackedOp)
    }

    unregisterTrackedOp(op: OpName, entryKey: EntryKey) {
        if (!this.trackedOps) return;
        const opMap = this.trackedOps.get(op)
        opMap?.delete(entryKey)
        if (opMap?.size === 0) {
            this.trackedOps.delete(op)
        }
    }

    getTrackedOp(op: OpName, entryKey: EntryKey) {
        if (!this.trackedOps) return;
        return this.trackedOps.get(op)?.get(entryKey)
    }
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