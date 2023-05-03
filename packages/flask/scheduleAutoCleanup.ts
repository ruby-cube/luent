
// [Param: stop] The cleanup function

import { getCovertFlask } from "./CovertFlasks";
import { getScene } from "./Scene";
import { getFlask, NestableFlask, Flask } from "./flask";
import type { Callback, CallbackRemover, PendingCancelOp } from "./flaskedListeners";

// [Return] boolean to indicate whether cleanup was successfully scheduled
// export let scheduleAutoCleanup: CleanupScheduler = () => { };
export let schedulingAutoCleanup = false; // to prevent infinite loop of auto cleanup listener
export let existingPendingAutoCleanup: PendingCancelOp[] | void | null;

type CleanupScheduler = (stop: CallbackRemover<void>) => PendingCancelOp[] | void

// export function defineAutoCleanup(cleanupScheduler: (stop: CallbackRemover<void>) => PendingCancelOp | void) {
export function scheduleAutoCleanup(stop: CallbackRemover<void>) {
    // if (_covertFlaskClasses.size === 0) return;
    schedulingAutoCleanup = true;
    const success = existingPendingAutoCleanup = cleanupScheduler(stop);
    schedulingAutoCleanup = false;
    existingPendingAutoCleanup = null;
    return success;
}
// }



// function cleanupScheduler(stop: CallbackRemover<void>) {
//     const scene = getScene();
//     const flask = getFlask();
//     const flaskAttachedToOuter = flask && !(<NestableFlask>flask).outlivesOuter
//     const outerFlask = flask ? ("outerFlask" in flask ? flask.outerFlask : flask) : (scene ? null : getCovertFlask()); //TODO: I need to climb the tree scheduling autocleanups
//     const pendingCancelOps = [];
//     if (scene && (!flask || flaskAttachedToOuter)) {
//         pendingCancelOps.push(scene.onEnded(stop));
//     }
//     if (flask) {
//         pendingCancelOps.push(flask.onDisposed(stop));
//     }
//     if (outerFlask && outerFlask !== flask && (!flask || flaskAttachedToOuter)) {
//         pendingCancelOps.push(outerFlask.onDisposed(stop));
//     }
//     return pendingCancelOps;

// }

// FIX: is existingPendingCancelOps getting in the way of nested flask cleanup?

function cleanupScheduler(stop: CallbackRemover<void>) {
    const pendingCancelOps = [] as PendingCancelOp[];
    const flask = getFlask();
    const rootFlask = (<NestableFlask>flask)?._root || getScene() || getCovertFlask();
    let nestedFlask: Flask | null = null;
    let currentFlask: Flask | null | undefined = flask || rootFlask;
    if (currentFlask) {
        do {
            pendingCancelOps.push(currentFlask.onDisposed(stop));
            nestedFlask = currentFlask;
            currentFlask = (<NestableFlask>currentFlask)._outerFlask || (currentFlask !== rootFlask ? rootFlask : null);
        } while (currentFlask && isAttached(<NestableFlask>nestedFlask))
    }
    if (pendingCancelOps.length === 0) return;
    return pendingCancelOps;
}

function isAttached(flask: NestableFlask) {
    return !flask.outlivesOuter;
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
