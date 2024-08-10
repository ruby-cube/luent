import { AnyObject } from "@rue/types";
import { ActiveListener, EnrollFunction, makeActiveListener, RemoveFunction } from "./ActiveListener";
import { makePendingCancelOp, PendingCancelOp } from "./PendingCancelOp";
import { makePendingOp, PendingOp } from "./PendingOp";

export type SustainedTargetedListener<T = any, CB extends Callback = Callback, O extends AnyObject = {}> = <
    OPT extends ListenerOptions & O,
>(target: T, callback: CB, options?: OPT) => ActiveListener;

export type ListenerOptions = {
    once?: boolean;
    until?: ScheduleStop;
    outlive?: boolean;
}

export type CallbackRemover = {
    (): void;
    isRemover: true;
};

export type Callback = (...arg: any[]) => any;
export type Callbacks = Set<Callback | CallbackRemover>;
export type ScheduleRemoval = ScheduleCancel | ScheduleStop;
export type ScheduleCancel = (cancel: CallbackRemover) => PendingCancelOp;
export type ScheduleStop = (stop: CallbackRemover) => PendingCancelOp;


export function $listen<
    CB extends Callback,
    E extends EnrollFunction
>(
    callback: CB,
    options: ListenerOptions,
    config: {
        enroll: E,
        remove: RemoveFunction<E>
    }
): CB extends CallbackRemover ? PendingCancelOp : ActiveListener {

    const { enroll, remove } = config;

    if (isRemover(callback)) {
        return makePendingCancelOp({
            callback,
            enroll,
            remove
        }) as CB extends CallbackRemover ? PendingCancelOp : ActiveListener
    }

    return makeActiveListener({
        callback,
        enroll,
        remove,
        options
    }) as CB extends CallbackRemover ? PendingCancelOp : ActiveListener
}




export type SchedulerOptions = {
    cancel?: ScheduleCancel,
    outlive?: boolean
}

export type ScheduledOp<CB extends Callback> = CB extends { isRemover: true } ? PendingCancelOp : PendingOp<ReturnType<CB>>

export function $schedule<
    CB extends Callback,
    E extends EnrollFunction
>(callback: CB, options: SchedulerOptions | undefined, config: {
    enroll: EnrollFunction,
    remove: RemoveFunction<E>
}): ScheduledOp<CB> {
    const { enroll, remove } = config;

    if (isRemover(callback)) {
        return makePendingCancelOp({
            callback,
            enroll,
            remove
        }) as ScheduledOp<CB>
    }

    return makePendingOp({
        callback,
        enroll,
        remove,
        options
    }) as ScheduledOp<CB>
}

function isRemover(callback: Callback) {
    return "isRemover" in callback && callback.isRemover;
}

