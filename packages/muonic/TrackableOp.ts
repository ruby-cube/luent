



import { ReactiveModel, toRaw } from "./useReactiveModels";

// This module creates a unique tuple for reactive prop so that reactive props can be used as unique keys in maps

const trackableOpMap: WeakMap<ReactiveModel, Map<any, OpMap>> = new WeakMap();

type OpMap = Map<string, _TrackableOp>

export type TrackableOp = [ReactiveModel, any, string]

class _TrackableOp extends Array {
    constructor(
        model: ReactiveModel,
        key: any,
        op: string,
        keyMap?: Map<any, OpMap>,
        opMap?: OpMap,
    ) {
        super();
        if (!keyMap) {
            keyMap = new Map()
            trackableOpMap.set(model, keyMap)
        }
        if (!opMap) {
            opMap = new Map()
            keyMap.set(key, opMap)
        }
        this.push(model, key, op);
        opMap.set(op, this)
    }
}

export function isTrackableOp(value: any): value is TrackableOp {
    if (!(value instanceof Object)) return false;
    return value instanceof _TrackableOp;
}

export function asTrackableOp(
    model: ReactiveModel,
    op: string,
    key: any
): TrackableOp {
    const keyMap = trackableOpMap.get(model);
    if (!keyMap) return new _TrackableOp(model, key, op) as unknown as TrackableOp;
    const opMap = keyMap.get(key);
    if (!opMap) return new _TrackableOp(model, key, op, keyMap) as unknown as TrackableOp;
    const trackableOp = opMap.get(op);
    if (!trackableOp) return new _TrackableOp(model, key, op, keyMap, opMap) as unknown as TrackableOp;
    return trackableOp as unknown as TrackableOp
}


export function getTrackableOpValue(op: TrackableOp) {
    const [target, arg, key] = op;
    return target[key](arg);
}

export function getTrackableOp(
    model: ReactiveModel,
    op: string,
    key: any
): TrackableOp | null {
    const keyMap = trackableOpMap.get(model);
    if (!keyMap) return null;
    const opMap = keyMap.get(key);
    if (!opMap) return null;
    const trackableOp = opMap.get(op);
    if (!trackableOp) return null;
    return trackableOp as unknown as TrackableOp
}

// export function getTrackableOps(
//     model: ReactiveModel,
//     triggerOp: TriggerOp,
//     key: any
// ): TrackableOp[] | null {
//     const ops = getCorrespondingOps(model, triggerOp);
//     const trackableOps = []
//     for (const op of ops) {
//         const trackableOp = getTrackableOp(model, op, key)
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