



import { AnyObject } from "@rue/types";
import { asIonicAtom } from "../derivations/IonicAtom";
import { MetaIonizedModel } from "./MetaIonizedModel";
import { asMetaIonizedModel, Ionized, IonizedModel } from "./ionize";




export class TrackedOp {

    constructor(
        public metaIonicModel: MetaIonizedModel,
        public op: string,
        public entryKey: any,
    ) {
        metaIonicModel.registerTrackedOp(op, entryKey, this)
    }

    discard() {
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
    model: Ionized<AnyObject>,
    op: string,
    key: any
): TrackedOp {
    const trackedOp = getTrackedOp(model, op, key)
    if (trackedOp) return trackedOp;
    return createTrackedOp(model, op, key)
}

export function getTrackedOp(
    model: IonizedModel,
    op: string,
    key: any
){
    return asMetaIonizedModel(model).getTrackedOp(op, key)
}

function createTrackedOp(
    model: IonizedModel,
    op: string,
    key: any
){
    const metaIonicModel = asMetaIonizedModel(model);
    const trackedOp = new TrackedOp(metaIonicModel, op, key)
    metaIonicModel.addObservedEntryKey(key)
    const atom = asIonicAtom(trackedOp);
    atom.onUntracked(() => {
        if (atom.derivations.size === 0) {
            metaIonicModel.deleteObservedEntryKey(key)
            trackedOp.discard()
        }
    })
    return trackedOp;
}

