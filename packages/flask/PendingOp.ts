import { bindFlask, getFlask, onFlaskDisposal } from "./EffectFlask";
import { CallbackRemover, SchedulerOptions } from "./flaskableListeners";
import { mapHandlers } from "./handlerMap";
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
    const flask = options?.flask

    let returnVal: any;
    let _resolve: (result?: any) => void;
    let pendingOp: PendingOp<ReturnType<CB>>
    let pendingCancelOp: PendingCancelOp | null;
    let pendingFlaskCleanup: PendingCancelOp | undefined;

    const _callback = bindFlask(oneTimeCallback, flask === 'outlive' ? null : flask) as CB

    mapHandlers(_callback, callback);

    function oneTimeCallback(...arg: any[]) {
        _resolve(callback(...arg));
        _remove()
    }

    function _remove() {
        remove(returnVal ?? _callback);
        if (__DEV__) unmarkNoCleanup(pendingOp);
        if (pendingCancelOp) pendingCancelOp.cancel();
        if (pendingFlaskCleanup) pendingFlaskCleanup.cancel();
    }

    returnVal = enroll(_callback);
    pendingOp = new Promise((resolve) => {
        _resolve = resolve;
    }) as PendingOp<ReturnType<CB>>

    let called = false;
    const cancel = (() => {
        if (called) return;
        _remove();
        _resolve(new Cancellation("Pending op canceled."))
        called = true;
    }) as CallbackRemover;
    cancel.isRemover = true as const; // Serves as a marker to indicate it should run only once if passed into a listener.
    //@ts-expect-error
    cancel.__devName = options?.__devName;

    pendingOp.cancel = cancel;

    pendingFlaskCleanup =
        flask && flask !== 'outlive' ? flask.onDisposal(cancel)
            : flask === 'outlive' ? undefined
                : onFlaskDisposal(cancel)

    pendingCancelOp = scheduleCancellation ? scheduleCancellation(cancel) : null;

    if (__DEV__ && flask !== 'outlive') setUpCleanupWarning!(pendingOp, scheduleCancellation, flask || getFlask())

    return pendingOp;
}