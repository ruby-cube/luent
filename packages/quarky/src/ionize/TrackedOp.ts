



import { asIonicAtom } from "../derivations/IonicAtom";
import { META } from "../ReactiveEntity";
import { Collection, MetaIonicCollection, MetaIonicModel } from "./MetaIonicModel";
import { asMetaIonicModel, IonicModel } from "./ionize";

// This module creates a unique tuple for reactive prop so that reactive props can be used as unique keys in maps

type EntryKeyMap = Map<EntryKey, TrackedOp>
type OpMap = Map<OpName, EntryKeyMap>
type EntryKey = any
type OpName = string

// const trackedOpMap: Map<MetaIonicModel, OpMap> = new Map()

export class TrackedOp {

    constructor(
        public metaIonicModel: MetaIonicModel,
        public op: string,
        public entryKey: any,
    ) {
        metaIonicModel.registerTrackedOp(op, entryKey, this)
    }

    destroy() {
        this.metaIonicModel.unregisterTrackedOp(this.op, this.entryKey)
    }

    getOutput(){
        return this.metaIonicModel.rawTarget[this.op](this.entryKey)
    }
}


// export function getOpOutput(op: TrackedOp) {
//     return op.metaIonicModel.rawTarget[op.op](op.entryKey);
// }

export function isTrackedOp(value: any): value is TrackedOp {
    if (!(value instanceof Object)) return false;
    return value instanceof TrackedOp;
}

export function asTrackedOp(
    model: IonicModel<Collection>,
    op: string,
    key: any
): TrackedOp {
    const trackedOp = getTrackedOp(model, op, key)
    if (trackedOp) return trackedOp;
    return createTrackedOp(model, op, key)
}

export function getTrackedOp(
    model: IonicModel,
    op: string,
    key: any
){
    return asMetaIonicModel(model).getTrackedOp(op, key)
}

function createTrackedOp(
    model: IonicModel<Collection>,
    op: string,
    key: any
){
    const metaIonicModel = asMetaIonicModel(model);
    const trackedOp = new TrackedOp(metaIonicModel, op, key)
    metaIonicModel.addWatchedEntryKey(key)
    const atom = asIonicAtom(trackedOp);
    atom.onUntracked(() => {
        if (atom.derivations.size === 0) {
            metaIonicModel.deleteWatchedEntryKey(key)
            trackedOp.destroy()
        }
    })
    return trackedOp;
}



// function registerTrackedOp(trackedOp: TrackedOp, model: IonicModel, op: string, key: any) {
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

// function unregisterTrackedOp(reactive: IonicModel, op: string, entryKey: any) {
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
//     model: IonicModel,
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


// function getCorrespondingOps(reactive: IonicModel, triggerOp: TriggerOp) {
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