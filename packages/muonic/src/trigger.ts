import { useUpdateCycle } from "./effects/UpdateCycle";
import { asWatchTarget, isWatched } from "./effects/watch";
import { asReactiveAtom, isReactiveAtom } from "./derivations/ReactiveAtom";
import { AnyObject } from "@rue/types";
import { MutationRecord } from "./effects/deepWatch";
import { ReactivePrimitive } from "./derivations/DependencyTracker";
import { runTriggerDebugger } from "./effects/debug";
import { ReactiveModel, toRaw } from "./reactivemodel/Reactive$";
import { TrackableOp } from "./reactivemodel/TrackableOp";
import { ReactiveProp } from "./reactivemodel/ReactiveProp";






export function triggerReactivePrimitive(target: ReactivePrimitive, newValue: any, oldValue: any) { //TODO: what happens if key for trackable ops is  undefined or null ? I need to use a UNDEFINED symbol
    if (__DEV__) {
        runTriggerDebugger(target)
    }

    // const updateCycle = useUpdateCycle()
    
    if (isWatched(target)) {
        const watchTarget = asWatchTarget(target);
        // updateCycle.storeInitialValue(target, oldValue)
        watchTarget.triggerEffects(newValue, oldValue)
    }
    
    if (isReactiveAtom(target)) {
        const atom = asReactiveAtom(target);
        atom.triggerDerivations()
    }
}

export function triggerReactiveModel(reactive: ReactiveModel, op: MutationRecord, clone?: AnyObject) {
    if (isWatched(reactive)) {
        const updateCycle = useUpdateCycle();
        const snapshot = updateCycle.takeSnapshot(reactive, toRaw(reactive), clone)
        updateCycle.storeInitialValue(reactive, snapshot)
        updateCycle.recordOp(reactive, op)
        const watchTarget = asWatchTarget(reactive);
        watchTarget.triggerEffects()
    }
}