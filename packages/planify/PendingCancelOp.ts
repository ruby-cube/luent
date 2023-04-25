import { survivingRemovers } from "./outlive";
import { Callback, PendingCancelOp, initAutoCleanup, initSceneAutoCleanup } from "./planify";


//QUESTION: should "outlive" apply to pending cancel ops??
export function makePendingCancelOp(config: {
    callback: Callback,
    enroll: (cb: Callback) => any,
    remove: (cbOrReturnVal: any) => void
}) {
    const { callback, enroll, remove } = config
    let returnVal: any;
    let pendingAutoCleanup: PendingCancelOp | void;
    let pendingSceneCleanup: PendingCancelOp | void;
    const outlive = survivingRemovers.has(callback);
    const _callback = () => {
        callback();
        remove(returnVal ?? _callback);
        if (pendingAutoCleanup) pendingAutoCleanup.cancel();
        if (pendingSceneCleanup) pendingSceneCleanup.cancel();
        survivingRemovers.delete(callback);
    }
    const cancel = () => { remove(returnVal ?? _callback) }
    cancel.isRemover = true as const;
    if (!outlive){
        pendingAutoCleanup = initAutoCleanup(cancel)
        pendingSceneCleanup = initSceneAutoCleanup(cancel)
    }
    returnVal = enroll(_callback);

    return {
        cancel
    } as PendingCancelOp
}