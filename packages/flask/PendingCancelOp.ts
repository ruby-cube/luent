import { bindFlask, getFlask, onFlaskDisposal } from "./flask";

export type PendingCancelOp = {
    cancel: () => void;
}

export function makePendingCancelOp(config: {
    callback: () => void,
    enroll: (cb: () => void) => any,
    remove: (cbOrReturnVal: any) => void
}): PendingCancelOp {
    const { callback, enroll, remove } = config
    let returnVal: any;
    let pendingFlaskCleanup: PendingCancelOp | undefined;

    const _callback = bindFlask(() => { //QUESTION: I'm not 100% sure if I need to bindFlask
        callback();
        _remove(); // so that callback will only be called once
    })

    let callCount = 0;
    function _remove() {
        if (callCount > 0) return;
        callCount++;
        remove(returnVal ?? _callback);
        if (pendingFlaskCleanup) pendingFlaskCleanup.cancel()
    }
    _remove.isRemover = true as const;

    pendingFlaskCleanup = onFlaskDisposal(_remove)

    try {
        returnVal = enroll(_callback);
    }
    finally {
        return {
            cancel: _remove
        }
    }

}