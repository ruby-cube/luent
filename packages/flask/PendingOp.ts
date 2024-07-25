import { addToFlask, bindFlask } from "./flask";
import { CallbackRemover, SchedulerOptions } from "./flaskedListeners";
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

    let returnVal: any;
    let _resolve: (result?: any) => void;
    let _reject: (reason?: any) => void;
    let pendingCancelOp: PendingCancelOp | null;

    const _callback = (bindFlask((...arg: any[]) => {
        _resolve(callback(...arg));
        remove(returnVal ?? _callback);
        if (pendingCancelOp) pendingCancelOp.cancel();
    })) as CB
    try {
        returnVal = enroll(_callback);
    }
    finally {
        const pendingOp = new Promise((resolve, reject) => {
            _resolve = resolve;
            _reject = reject;
        }) as PendingOp<ReturnType<CB>>

        const _cancel = (() => {
            try {
                remove(returnVal ?? _callback);
            }
            catch (e) {
                console.trace();
                const err = e instanceof Error ? e : new Error(String(e));
                _reject(new Cancellation(err));
            }
            finally {
                if (pendingCancelOp) pendingCancelOp.cancel();
                _reject(new Cancellation("Pending op canceled."))
            }
        }) as CallbackRemover;
        _cancel.isRemover = true as const; // Serves as a marker to indicate it should run only once if passed into a listener.

        pendingOp.cancel = _cancel;

        addToFlask(_cancel)

        pendingCancelOp = scheduleCancellation ? scheduleCancellation(_cancel) : null;

        return pendingOp;
    }

}