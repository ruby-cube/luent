
// [Param: stop] The cleanup function

import { _rootFlaskClasses } from "./RootFlasks";
import { getScene } from "./Scene";
import { getFlask, _getRootFlask } from "./flask";
import type { Callback, CallbackRemover, PendingCancelOp } from "./flaskedListeners";

// [Return] boolean to indicate whether cleanup was successfully scheduled
// export let scheduleAutoCleanup: CleanupScheduler = () => { };
export let schedulingAutoCleanup = false; // to prevent infinite loop of auto cleanup listener
export let existingPendingAutoCleanup: PendingCancelOp[] | void | null;

type CleanupScheduler = (stop: CallbackRemover<void>) => PendingCancelOp[] | void

// export function defineAutoCleanup(cleanupScheduler: (stop: CallbackRemover<void>) => PendingCancelOp | void) {
export function scheduleAutoCleanup(stop: CallbackRemover<void>) {
    if (_rootFlaskClasses.size === 0) return;
    schedulingAutoCleanup = true;
    const success = existingPendingAutoCleanup = cleanupScheduler(stop);
    schedulingAutoCleanup = false;
    existingPendingAutoCleanup = null;
    return success;
}
// }



function cleanupScheduler(stop: CallbackRemover<void>) {
    const scene = getScene();
    const flask = getFlask();
    const rootFlask = flask ? flask.root : scene ? null : _getRootFlask();
    const pendingCancelOps = [];
    if (scene) {
        pendingCancelOps.push(scene.onEnded(stop));
    }
    if (flask) {
        pendingCancelOps.push(flask.onDisposed(stop));
    }
    if (rootFlask && rootFlask !== flask) {
        pendingCancelOps.push(rootFlask.onDisposed(stop));
    }
    return pendingCancelOps;
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
