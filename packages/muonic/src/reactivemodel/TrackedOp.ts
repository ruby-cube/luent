



import { ReactiveAtom } from "../derivations/ReactiveAtom";
import { destroyAsAtom, initializeAsAtom, ReactivePrimitive } from "../ReactivePrimitive";
import { MetaReactiveModel, REACTIVE_MODEL_MARKER } from "./ReactiveModel";

// This module creates a unique tuple for reactive prop so that reactive props can be used as unique keys in maps

type OpMap = Map<string, TrackedOp>
type OpName = string

const MODEL = 0;
const OP = 1;
const ENTRY_KEY = 2;


export class TrackedOp extends Array implements ReactivePrimitive {

    constructor(
        metaReactive: MetaReactiveModel,
        entryKey: any,
        op: string,
    ) {
        super();
        metaReactive.registerTrackedOp(op, entryKey, this)
        this.push(metaReactive, op, entryKey);
    }

    destroy() {
        (<MetaReactiveModel>this[MODEL]).unregisterTrackedOp(this[OP], this[ENTRY_KEY])
    }

    asAtom?: ReactiveAtom | undefined;
    initializeAsAtom = initializeAsAtom
    destroyAsAtom = destroyAsAtom
}

export function isTrackedOp(value: any): value is TrackedOp {
    if (!(value instanceof Object)) return false;
    return value instanceof TrackedOp;
}

export function asTrackedOp(
    model: MetaReactiveModel,
    op: string,
    key: any
): TrackedOp {
    const trackedOp = model.getTrackedOp(key, op)
    if (trackedOp) return trackedOp;
    return new TrackedOp(model, key, op)
}


export function getTrackableOpValue(op: TrackedOp) {
    const [target, arg, key] = op;
    return target[key](arg);
}



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