import { bindFlask, getFlask, onFlaskDisposal } from "./EffectFlask";

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
    // let pendingFlaskCleanup: PendingCancelOp | undefined;

    const _callback = () => {
        callback();
        _remove(); // so that callback will only be called once
    }

    let called = false;
    function _remove() {
        if (called) return;
        // try {
        remove(returnVal ?? _callback);
        called = true;
        // }
        // finally {
        //     if (pendingFlaskCleanup) pendingFlaskCleanup.cancel()
        // }
    }
    _remove.isRemover = true as const;

    // pendingFlaskCleanup = onFlaskDisposal(_remove)

    returnVal = enroll(_callback);
    
    return {
        cancel: _remove
    }
}