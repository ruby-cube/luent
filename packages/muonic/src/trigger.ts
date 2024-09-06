import { useUpdateCycle } from "./UpdateCycle";
import { asWatchTarget, isWatched } from "./watch";
import { asReactiveAtom, isReactiveAtom } from "./ReactiveAtom";
import { AnyObject } from "@rue/types";
import { MutationRecord } from "./deepWatch";
import { ReactivePrimitive } from "./DependencyTracker";
import { runTriggerDebugger } from "./debug";
import { ReactiveModel, toRaw } from "./Reactive$";


export function triggerReactivePrimitive(target: ReactivePrimitive, newValue: any, oldValue: any) { //TODO: what happens if key for trackable ops is  undefined or null ? I need to use a UNDEFINED symbol
    if (__DEV__) {
        runTriggerDebugger(target)
    }

    const updateCycle = useUpdateCycle()

    if (isWatched(target)) {
        const watchTarget = asWatchTarget(target);
        updateCycle.storeInitialValue(target, oldValue)
        watchTarget.triggerEffects(newValue, oldValue)
    }

    if (isReactiveAtom(target)) {
        const atom = asReactiveAtom(target);
        atom.triggerDerivations()
    }

    return updateCycle;
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