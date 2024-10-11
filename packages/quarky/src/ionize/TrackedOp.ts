



import { asIonicAtom } from "../derivations/IonicAtom";
import { MetaIonicModel } from "./MetaIonicModel";
import { asMetaIonicModel, IonicModel } from "./ionize";




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


export function isTrackedOp(value: any): value is TrackedOp {
    if (!(value instanceof Object)) return false;
    return value instanceof TrackedOp;
}

export function asTrackedOp(
    model: IonicModel,
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
    model: IonicModel,
    op: string,
    key: any
){
    const metaIonicModel = asMetaIonicModel(model);
    const trackedOp = new TrackedOp(metaIonicModel, op, key)
    metaIonicModel.addObservedEntryKey(key)
    const atom = asIonicAtom(trackedOp);
    atom.onUntracked(() => {
        if (atom.derivations.size === 0) {
            metaIonicModel.deleteObservedEntryKey(key)
            trackedOp.destroy()
        }
    })
    return trackedOp;
}

