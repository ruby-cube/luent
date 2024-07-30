import { AnyObject } from "@rue/types";
import { ActiveListener, EnrollFunction, makeActiveListener, RemoveFunction } from "./ActiveListener";
import { makePendingCancelOp, PendingCancelOp } from "./PendingCancelOp";
import { makePendingOp, PendingOp } from "./PendingOp";

export type SustainedTargetedListener<T = any, CB extends Callback = Callback, O extends AnyObject = {}> = <
    OPT extends ListenerOptions & O,
>(target: T, callback: CB, options?: OPT) => ActiveListener;

export type ListenerOptions = {
    once?: true;
    until?: ScheduleStop;
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
    cancel?: ScheduleCancel
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


// export function initAutoCancel(cancel: CallbackRemover) {
//     let success: false | PendingCancelOp = schedulingSceneCleanup ? existingPendingAutoCleanup! : false;
//     if (settingUpScene) {
//         if (!unattachedScene && !schedulingAutoCleanup)
//             success = scheduleAutoCleanup(cancel);
//     }
//     else if (!schedulingAutoCleanup) return scheduleAutoCleanup(cancel);
// }

// export function initSceneAutoCancel(cancel: CallbackRemover){
//     let success: false | PendingCancelOp = schedulingSceneCleanup ? existingPendingSceneCleanup! : false;
//     if (settingUpScene && !schedulingSceneCleanup) {
//        success = scheduleSceneCleanup(cancel);
//     }
//     return success;
// }



// export function initAutoCleanup(stop: CallbackRemover) {
//     return schedulingAutoCleanup ? existingPendingAutoCleanup! : scheduleAutoCleanup(stop);
// }
// export function initAutoCleanup(stop: CallbackRemover) {
//     let success: void | PendingCancelOp[] = schedulingSceneCleanup ? existingPendingAutoCleanup! : undefined;
//     if (settingUpScene) {
//         if (!schedulingAutoCleanup)
//             success = scheduleAutoCleanup(stop);
//     }
//     else {
//         success = schedulingAutoCleanup ? existingPendingAutoCleanup! : scheduleAutoCleanup(stop);
//     }
//     return success;
// }

// export function initSceneAutoCleanup(stop: CallbackRemover) {
//     let success: void | PendingCancelOp = schedulingSceneCleanup ? existingPendingSceneCleanup! : undefined;
//     if (settingUpScene && !schedulingSceneCleanup) {
//         success = scheduleSceneCleanup!(stop);
//     }
//     return success;
// }



// export function $subscribe<  //QUESTION: is this really necessary? Just use $listen..  The only use case is "computed"
//     CB extends Callback,
//     RET,
//     ARG extends RET extends void ? CB : RET,
//     OPT extends ListenerOptions | undefined,
//     C extends MaybeCB,
//     MaybeCB extends MaybeBadScheduler<OPT, CB>,
// >(callback: CB, options: OPT, config: {
//     enroll: (callback: Callback) => RET,
//     remove: (cbOrReturnVal: ARG) => void
// }): SustainedListenerReturn<CB, OPT, C, MaybeCB> {

//     const { enroll, remove } = config;

//     if (isRemover(callback)) {
//         return makePendingCancelOp({
//             callback,
//             enroll,
//             remove
//         }) as SustainedListenerReturn<CB, OPT, C, MaybeCB>
//     }

//     return makeActiveListener({
//         callback,
//         enroll,
//         remove,
//         options
//     }) as SustainedListenerReturn<CB, OPT, C, MaybeCB>
// }




