
// [Param: stop] The cleanup function

import type { SceneEndListener } from "./Scene";
import type { Callback, CallbackRemover, PendingCancelOp } from "./planify";

// [Return] boolean to indicate whether cleanup was successfully scheduled
export let scheduleAutoCleanup: CleanupScheduler = () => {};
export let schedulingAutoCleanup = false; // to prevent infinite loop of auto cleanup listener
export let existingPendingAutoCleanup: PendingCancelOp | void | null;

type CleanupScheduler = (stop: CallbackRemover<void>) => PendingCancelOp | void

export function defineAutoCleanup(cleanupScheduler: (stop: CallbackRemover<void>) => PendingCancelOp | void) {
    scheduleAutoCleanup = (stop) => {
        schedulingAutoCleanup = true;
        const success = existingPendingAutoCleanup = cleanupScheduler(stop);
        schedulingAutoCleanup = false;
        existingPendingAutoCleanup = null;
        return success;
    }
}



export let scheduleSceneCleanup: (stop: CallbackRemover<void>) => PendingCancelOp;
export let schedulingSceneCleanup = false; // to prevent infinite loop of auto cleanup listener
export let existingPendingSceneCleanup: PendingCancelOp | null;

export function defineSceneCleanup(cleanupScheduler: SceneEndListener) {
    scheduleSceneCleanup = (stop) => {
        schedulingSceneCleanup = true;
        const pendingCancelOp = existingPendingSceneCleanup = cleanupScheduler(stop)
        schedulingSceneCleanup = false;
        existingPendingSceneCleanup = null;
        return pendingCancelOp;
    }
}





export type CBParam<T extends (...args: any[]) => any> = Parameters<Parameters<T>[1]>[0]

export function memSafeCB(callback: Callback, transformArg: (arg: any) => any) {
    function safeCB(arg: any) {
        if ("isRemover" in callback) callback();
        else callback(transformArg(arg));
    }
    if ("isRemover" in callback) {
        safeCB.isRemover = true as const
    }
    return safeCB;
}
