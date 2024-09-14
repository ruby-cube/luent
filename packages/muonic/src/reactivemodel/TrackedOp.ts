



import { asReactiveAtom } from "../derivations/ReactiveAtom";
import { META } from "../ReactiveEntity";
import { Collection, MetaReactiveCollection, MetaReactiveModel } from "./MetaReactiveModel";
import { getMetaReactive, ReactiveModel } from "./ReactiveModel";

// This module creates a unique tuple for reactive prop so that reactive props can be used as unique keys in maps

type EntryKeyMap = Map<EntryKey, TrackedOp>
type OpMap = Map<OpName, EntryKeyMap>
type EntryKey = any
type OpName = string

const trackedOpMap: Map<ReactiveModel, OpMap> = new Map()

export class TrackedOp {

    constructor(
        public metaReactive: MetaReactiveModel,
        public op: string,
        public entryKey: any,
    ) {
        metaReactive.registerTrackedOp(op, entryKey, this)
    }

    destroy() {
        this.metaReactive.unregisterTrackedOp(this.op, this.entryKey)
    }

    getOutput(){
        return this.metaReactive.rawTarget[this.op](this.entryKey)
    }
}


// export function getOpOutput(op: TrackedOp) {
//     return op.metaReactive.rawTarget[op.op](op.entryKey);
// }

export function isTrackedOp(value: any): value is TrackedOp {
    if (!(value instanceof Object)) return false;
    return value instanceof TrackedOp;
}

export function asTrackedOp(
    model: ReactiveModel<Collection>,
    op: string,
    key: any
): TrackedOp {
    const trackedOp = getTrackedOp(model, op, key)
    if (trackedOp) return trackedOp;
    return createTrackedOp(model, op, key)
}

export function getTrackedOp(
    model: ReactiveModel,
    op: string,
    key: any
){
    return trackedOpMap.get(model)?.get(op)?.get(key)
}

function createTrackedOp(
    model: ReactiveModel<Collection>,
    op: string,
    key: any
){
    const metaReactive = getMetaReactive(model);
    const trackedOp = new TrackedOp(metaReactive, op, key)
    metaReactive.addObservedEntryKey(key)
    const atom = asReactiveAtom(trackedOp);
    atom.onUntracked(() => {
        if (atom.derivations.size === 0) {
            metaReactive.deleteObservedEntryKey(key)
            trackedOp.destroy()
        }
    })
    return trackedOp;
}



// function registerTrackedOp(trackedOp: TrackedOp, model: ReactiveModel, op: string, key: any) {
//     let opMap = trackedOpMap.get(model)
//     if (!opMap) {
//         opMap = new Map()
//         trackedOpMap.set(model, opMap)
//     }
//     let entryKeyMap = opMap.get(op)
//     if (!entryKeyMap) {
//         entryKeyMap = new Map()
//         opMap.set(op, entryKeyMap)
//     }
//     entryKeyMap.set(key, trackedOp);
// }

// function unregisterTrackedOp(reactive: ReactiveModel, op: string, entryKey: any) {
//     const opMap = trackedOpMap.get(reactive)!
//     const entryKeyMap = opMap.get(op)!
//     if (__DEV__ && !entryKeyMap) throw new Error("No entryKeyMap :( this should never happen")
//     entryKeyMap.delete(entryKey)
//     if (entryKeyMap.size === 0) {
//         opMap.delete(op)
//     }
//     if (opMap.size === 0) {
//         trackedOpMap.delete(reactive)
//     }
// }

// export function getTrackableOps(
//     model: ReactiveModel,
//     triggerOp: TriggerOp,
//     key: any
// ): TrackedOp[] | null {
//     const ops = getCorrespondingOps(model, triggerOp);
//     const trackableOps = []
//     for (const op of ops) {
//         const trackableOp = getTrackedOp(model, op, key)
//         if (!trackableOp) continue;
//         trackableOps.push(trackableOp);
//     }
//     if (trackableOps.length === 0)
//         return null;
//     return trackableOps;
// }



// ---


// type TriggerOp = 'set' | 'delete' | 'add' | '_set_'

// const mapTriggerOpsMap = {
//     set: ['get', 'has'],
//     delete: ['get', 'has']
// }

// const setTriggerOpsMap = {
//     add: ['has'],
//     delete: ['has']
// }

// const arrayTriggerOpsMap = {
//     _set_: ['at'],
// }


// function getCorrespondingOps(reactive: ReactiveModel, triggerOp: TriggerOp) {
//     const model = toRaw(reactive);
//     if (model instanceof Array && triggerOp in arrayTriggerOpsMap) {
//         return arrayTriggerOpsMap[<keyof typeof arrayTriggerOpsMap>triggerOp];
//     }
//     if (model instanceof Set && triggerOp in setTriggerOpsMap) {
//         return setTriggerOpsMap[<keyof typeof setTriggerOpsMap>triggerOp];
//     }
//     if (model instanceof Map && triggerOp in mapTriggerOpsMap) {
//         return mapTriggerOpsMap[<keyof typeof mapTriggerOpsMap>triggerOp];
//     }
//     throw new Error(`INVALID INPUT: reactive: ${reactive}, triggerOp: ${triggerOp}`)
// }