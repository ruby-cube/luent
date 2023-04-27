import { survivingRemovers } from "./outlive";
import { Callback, PendingCancelOp, initAutoCleanup, initSceneAutoCleanup } from "./flaskedListeners";


//QUESTION: should "outlive" apply to pending cancel ops??
export function makePendingCancelOp(config: {
    callback: Callback,
    enroll: (cb: Callback) => any,
    remove: (cbOrReturnVal: any) => void
}) {
    const { callback, enroll, remove } = config
    let returnVal: any;
    let pendingAutoCleanups: PendingCancelOp[] | void;
    // let pendingSceneCleanup: PendingCancelOp | void;
    const outlive = survivingRemovers.has(callback);
    const _callback = () => {
        callback();
        remove(returnVal ?? _callback);
        if (outlive) survivingRemovers.delete(callback);
        else if (pendingAutoCleanups) {
            for (const cleanup of pendingAutoCleanups){
                cleanup.cancel();
            }
        }
    }
    const cancel = () => { 
        remove(returnVal ?? _callback);
        if (outlive) survivingRemovers.delete(callback);
        else if (pendingAutoCleanups) {
            for (const cleanup of pendingAutoCleanups){
                cleanup.cancel();
            }
        }
    }
    cancel.isRemover = true as const;
    if (!outlive){
        pendingAutoCleanups = initAutoCleanup(cancel)
        // pendingSceneCleanup = initSceneAutoCleanup(cancel)
    }
    returnVal = enroll(_callback);

    return {
        cancel
    } as PendingCancelOp
}