import { RegisterAbortSignal } from "./AbortSignal";
import { getFlask, onFlaskDisposal } from "./EffectFlask";
import { CallbackRemover, useCleanupScheduler } from "./flaskableListeners";
import { mapHandlers } from "./handlerMap";
import { setUpCleanupWarning, unmarkNoCleanup } from "./initFlask";
import { PendingCancelOp } from "./PendingCancelOp";

export type PendingOp<T = unknown> = Promise<T> & {
    cancel: () => void;
}


export const NEVER = null;

export type SchedulerOptions = {
    cancel?: ScheduleCancel | AbortSignal | typeof NEVER,
    // flask?: EffectFlask | null | 'outlive',
    __devName?: string
}

export type ScheduleCancel = (cancel: CallbackRemover) => PendingCancelOp;


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
    let scheduleCancellation = options?.cancel as ScheduleCancel | RegisterAbortSignal | null | undefined | any[]

    if (scheduleCancellation instanceof Array) {
        scheduleCancellation = useCleanupScheduler(...scheduleCancellation)
    }
    // const flask = options?.flask

    let returnVal: any;
    let _resolve: (result?: any) => void;
    let pendingOp: PendingOp<ReturnType<CB>>
    let pendingCancelOp: PendingCancelOp | null;
    let pendingFlaskCleanup: PendingCancelOp | undefined;

    const _callback = oneTimeCallback as CB
    // const _callback = bindFlask(oneTimeCallback, flask === 'outlive' ? null : flask) as CB

    mapHandlers(_callback, callback);

    function oneTimeCallback(...arg: any[]) {
        const output = callback(...arg)
        _resolve(output);
        _remove()
        return output;
    }

    function _remove() {
        remove(returnVal ?? _callback);
        if (__DEV__) unmarkNoCleanup(pendingOp);
        if (pendingCancelOp) pendingCancelOp.cancel();
        else if (pendingFlaskCleanup) pendingFlaskCleanup.cancel();
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

    if (scheduleCancellation) {
        pendingCancelOp = scheduleCancellation ? scheduleCancellation(cancel) : null;
    }
    else if (scheduleCancellation !== NEVER) {
        pendingFlaskCleanup = onFlaskDisposal(cancel)
    }

    if (__DEV__ && scheduleCancellation !== NEVER) setUpCleanupWarning!(pendingOp, scheduleCancellation, getFlask())

    return pendingOp;
}