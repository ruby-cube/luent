import type { AnyObject } from "@rue/types"
import type { Ionized, IonizedModel } from "./ionize"
import type { TrackedOp } from "./TrackedOp"
import type { ReactiveEntity } from "../ReactiveEntity"
import { PropIon } from "./PropIon"
import { IonicDerivation } from "../derivations/IonicDerivation"




type OpMap = Map<EntryKey, TrackedOp>
type OpName = string
type EntryKey = any

export const IONIZED_MODEL = Symbol('ionicModel')

export class MetaIonicModel<T extends AnyObject = AnyObject> implements ReactiveEntity {
    ionicModel?: Ionized<T>
    // shallowReactive?: IonizedModel<T>
    readonly type = IONIZED_MODEL

    asProtected?: Ionized<T>
    asReadonly?: Ionized<T>

    initIonicModel(ionicModel: Ionized<T>) {
        if (this.ionicModel) return;
        this.ionicModel = ionicModel as Ionized<T>;
    }

    // initShallowReactive(ionicModel: IonizedModel) {
    //     if (this.deepReactive) return;
    //     this.deepReactive = ionicModel as IonizedModel<T>;
    // }

    constructor(
        public rawTarget: T,
        public methods: AnyObject = {}
        // public reactive: T
        // public traps?: ReactiveTraps<T>
    ) {
    }

    private appendedProperties: Set<PropertyKey> = new Set()

    isNewProperty(key: PropertyKey) {
        return !(key in this.rawTarget) && !(key in this.methods) && !this.appendedProperties.has(key)
    }

    registerNewProperty(key: PropertyKey) {
        this.appendedProperties.add(key)
        this.markDirty()
    }

    private hasNewAbsorbedIons: boolean = true;
    private markDirty() {
        this.hasNewAbsorbedIons = true
    }
    private undirty() {
        this.hasNewAbsorbedIons = false;
    }

    private asDerivation?: IonicDerivation
    trackAbsorbedIons() {
        if (this.asDerivation && this.hasNewAbsorbedIons === false) return;
        const derivation = this.asDerivation || (this.asDerivation = new IonicDerivation(this.ionicModel, IONIZED_MODEL, false))
        derivation.trackAtoms(this.ionicModel!)
        this.undirty()
    }

    // observedProps?: Map<PropertyKey, ObservedProp>

    // registerObservedProp(key: PropertyKey, prop: ObservedProp) {
    //     if (!this.observedProps) this.observedProps = new Map()
    //     this.observedProps.set(key, prop)
    // }

    // unregisterObservedProp(key: PropertyKey) {
    //     if (!this.observedProps) return;
    //     this.observedProps.delete(key)
    // }

    // getObservedProp(key: PropertyKey) {
    //     if (!this.observedProps) return;
    //     return this.observedProps.get(key)
    // }



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


    // multiPropIons?: Map<string, DerivedIon>

    // registerMultiPropIon(key: string, ion: DerivedIon) {
    //     if (!this.multiPropIons) this.multiPropIons = new Map()
    //     this.multiPropIons.set(key, ion)
    // }

    // unregisterMultiPropIon(key: string) { //QUESTION: When to unregister?
    //     if (!this.multiPropIons) return;
    //     this.multiPropIons.delete(key)
    // }

    // getMultiPropIon(key: string) {
    //     if (!this.multiPropIons) return;
    //     return this.multiPropIons.get(key)
    // }



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


    // allows collections to efficiently trigger observed props/ops when a sweeping mutation like clear() or .length = 0 occurs
    observedEntryKeys? : Set<PropertyKey>

    addObservedEntryKey(entryKey: any) {
        if (!this.observedEntryKeys) this.observedEntryKeys = new Set()
        this.observedEntryKeys.add(entryKey)
    }

    deleteObservedEntryKey(entryKey: any) {
        if (!this.observedEntryKeys) return;
        this.observedEntryKeys.delete(entryKey)
    }
}



// export type Collection<K = any, V = any> = Set<K> | Array<K> | Map<K, V>

// export class MetaIonicCollection<T extends Collection = Collection> extends MetaIonicModel<T> {
//     constructor(rawTarget: T, methods: AnyObject = {}) {
//         super(rawTarget, methods)
//     }

//     observedEntryKeys = new Set()

//     addObservedEntryKey(entryKey: any) {
//         this.observedEntryKeys.add(entryKey)
//     }

//     deleteObservedEntryKey(entryKey: any) {
//         this.observedEntryKeys.delete(entryKey)
//     }
// }

// export function isCollection(target: unknown): target is Collection {
//     return target instanceof Array || target instanceof Set || target instanceof Map
// }