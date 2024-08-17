import { bindFlask, getFlask, onFlaskDisposal } from "./flask";
import { CallbackRemover, SchedulerOptions } from "./flaskableListeners";
import { setUpCleanupWarning, unmarkNoCleanup } from "./initFlask";
import { PendingCancelOp } from "./PendingCancelOp";

export type PendingOp<T = unknown> = Promise<T> & {
    cancel: () => void;
}

export class Cancellation {
    reason: string | Error | undefined;
    constructor(reason?: string | Error) {
        this.reason = reason;
    }
}

export function makePendingOp<CB extends (...arg: any[]) => any>(config: {
    callback: CB,
    enroll: (callback: CB) => any,
    remove: (cbOrReturnVal: (() => any) | any) => void,
    options: SchedulerOptions | undefined
}): PendingOp<ReturnType<CB>> {
    const { callback, enroll, remove, options } = config;
    const scheduleCancellation = options?.cancel;
    const outlive = options?.outlive

    let returnVal: any;
    let _resolve: (result?: any) => void;
    let pendingOp: PendingOp<ReturnType<CB>>
    let pendingCancelOp: PendingCancelOp | null;
    let pendingFlaskCleanup: PendingCancelOp | undefined;

    const _callback = (bindFlask((...arg: any[]) => {
        _resolve(callback(...arg));
        _remove()
    })) as CB

    function _remove() {
        try {
            remove(returnVal ?? _callback);
            if (__DEV__) unmarkNoCleanup(pendingOp);
        }
        finally {
            if (pendingCancelOp) pendingCancelOp.cancel();
            if (pendingFlaskCleanup) pendingFlaskCleanup.cancel();
        }
    }

    try {
        returnVal = enroll(_callback);
    }
    finally {
        pendingOp = new Promise((resolve) => {
            _resolve = resolve;
        }) as PendingOp<ReturnType<CB>>

        let callCount = 0;
        const cancel = (() => {
            if (callCount > 0) return;
            callCount++;
            _remove();
            _resolve(new Cancellation("Pending op canceled."))
        }) as CallbackRemover;
        cancel.isRemover = true as const; // Serves as a marker to indicate it should run only once if passed into a listener.

        pendingOp.cancel = cancel;

        if (!outlive) pendingFlaskCleanup = onFlaskDisposal(cancel)

        pendingCancelOp = scheduleCancellation ? scheduleCancellation(cancel) : null;

        if (__DEV__) setUpCleanupWarning!(pendingOp, scheduleCancellation)

        return pendingOp;
    }
}