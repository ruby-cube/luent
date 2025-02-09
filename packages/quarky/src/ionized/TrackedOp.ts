



import { AnyObject } from "@rue/types";
import { asParticle } from "../Compound/Particle";
import { MetaIonizedModel } from "./IonizedModelQuarks";
import { Ionized, IonizedModel } from "./ionize";
import { quarksOf } from "../Quarks";




export class TrackedOp { //QUESTION: should this be tracked op or trackable op??  because becoming an ionic atom is the "tracked" part

    constructor(
        public metaIonizedModel: MetaIonizedModel,
        public op: string,
        public entryKey: any,
    ) {
        metaIonizedModel.registerTrackedOp(op, entryKey, this)
    }

    discard() {
        this.metaIonizedModel.unregisterTrackedOp(this.op, this.entryKey)
    }

    getOutput(){
        return this.metaIonizedModel.rawTarget[this.op](this.entryKey)
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
    return quarksOf(model).getTrackedOp(op, key)
}

function createTrackedOp(
    model: IonizedModel,
    op: string,
    key: any
){
    const metaIonizedModel = quarksOf(model);
    const trackedOp = new TrackedOp(metaIonizedModel, op, key)
    metaIonizedModel.addObservedEntryKey(key)
    const atom = asParticle(trackedOp);
    atom.onUntracked(() => {
        if (atom.derivations.size === 0) {
            metaIonizedModel.deleteObservedEntryKey(key)
            trackedOp.discard()
        }
    })
    return trackedOp;
}

