import { Cast, MiscObj } from "@rue/types";
import { makeActiveListener } from "./ActiveListener";
import { makePendingCancelOp } from "./PendingCancelOp";
import { makePendingOp, PendingOp } from "./PendingOp";
import { existingPendingAutoCleanup, existingPendingSceneCleanup, scheduleAutoCleanup, scheduleSceneCleanup, schedulingAutoCleanup, schedulingSceneCleanup } from "./scheduleAutoCleanup";


export type ListenerOptions = {
    once?: true;
    sustain?: true;
    unlessCanceled?: ScheduleCancel;
    until?: ScheduleStop;
    $lifetime?: true;
    $tilStop?: true;
}


export const $lifetime = true;
export const $tilStop = true;

export type ActiveListener = {
    stop(): void;
}

export type PendingCancelOp = {
    cancel: () => void;
}

export type CallbackRemover<R extends never | void> = {
    (): R;
    isRemover: true;
};

export type Callback = (...arg: any[]) => any;
export type Callbacks = Set<Callback | CallbackRemover<any>>;
export type ScheduleRemoval = ScheduleCancel | ScheduleStop;
export type ScheduleCancel = (cancel: CallbackRemover<never | void>) => PendingCancelOp;
export type ScheduleStop = (stop: CallbackRemover<void>) => void;


export type OneTimeListener<CB extends Callback = Callback, O extends MiscObj = {}> = <
    OPT extends ListenerOptions & O,
    C extends MaybeCB,
    MaybeCB extends MaybeBadScheduler<OPT, CB>
>(callback: C, options?: OPT) => OneTimeListenerReturn<CB, OPT, C, MaybeCB>;

export type SustainedListener<CB extends Callback = Callback, O extends MiscObj = {}> = <
    OPT extends ListenerOptions & O,
    C extends MaybeCB,
    MaybeCB extends MaybeBadScheduler<OPT, CB>
>(callback: C, options?: OPT) => SustainedListenerReturn<CB, OPT, C, MaybeCB>

export type OneTimeTargetedListener<T = any, CB extends Callback = Callback, O extends MiscObj = {}> = <
    OPT extends ListenerOptions & O,
    C extends MaybeCB,
    MaybeCB extends MaybeBadScheduler<OPT, CB>
>(target: T, callback: C, options?: OPT) => OneTimeListenerReturn<CB, OPT, C, MaybeCB>;

export type SustainedTargetedListener<T = any, CB extends Callback = Callback, O extends MiscObj = {}> = <
    OPT extends ListenerOptions & O,
    C extends MaybeCB,
    MaybeCB extends MaybeBadScheduler<OPT, CB>
>(target: T, callback: C, options?: OPT) => SustainedListenerReturn<CB, OPT, C, MaybeCB>;

export type OneTimeListenerReturn<CB extends Callback, OPT, C extends MaybeCB, MaybeCB extends MaybeBadScheduler<OPT, CB>> = C extends { isRemover: true } ? PendingCancelOp : (OPT extends { once: true } | { unlessCanceled: ScheduleCancel } | undefined ? PendingOp<ReturnType<C>> : (OPT extends { sustain: true } | { until: ScheduleStop } | { $tilStop: true } | { $lifetime: true } ? ActiveListener : PendingOp<ReturnType<C>>));
export type SustainedListenerReturn<CB extends Callback, OPT, C extends MaybeCB, MaybeCB extends MaybeBadScheduler<OPT, CB>> = C extends { isRemover: true } ? PendingCancelOp : OPT extends { once: true } | { unlessCanceled: ScheduleCancel } ? PendingOp<ReturnType<C>> : OPT extends { sustain: true } | { until: ScheduleStop } | undefined ? ActiveListener : ActiveListener;

export type MaybeBadScheduler<OPT, CB> = OPT extends { until: infer U } ? U extends (arg: infer P) => any ? P extends Callback ? CB : "Error: Parameter needed in `until` listener" : CB : CB;



let settingUpScene = false;
let unattachedScene = false;
export function markSceneSetup(state: boolean, unattached: boolean) {
    settingUpScene = state;
    unattachedScene = unattached;
}


export function $listen<
    CB extends Callback,
    RET,
    ARG extends RET extends void ? CB : RET,
    ONCE extends {onceAsDefault?: true},
    OPT extends ListenerOptions | undefined,
    C extends MaybeCB,
    MaybeCB extends MaybeBadScheduler<OPT, CB>,
>(callback: CB, options: OPT, config: {
    enroll: (callback: Callback) => RET,
    remove: (cbOrReturnVal: ARG) => void
} & ONCE): ONCE extends {onceAsDefault: true} ? OneTimeListenerReturn<CB, OPT, C, MaybeCB> : SustainedListenerReturn<CB, OPT, C, MaybeCB> {

    const { enroll, remove, onceAsDefault } = config;
    let once: boolean | undefined = "once" in callback && callback.once === true || false;
    let sustain: boolean | undefined = true;
    const until = options?.until;
    const scheduleCancellation = options?.unlessCanceled;

    if (onceAsDefault) {
        sustain = options?.sustain || options?.$lifetime || options?.$tilStop;
        once = (sustain || until) ? false : true;
    }
    else {
        once = (once || options?.once || Boolean(scheduleCancellation));
        sustain = !once;
    }

    if (__DEV__) {
        if (
            options?.unlessCanceled && options?.until ||
            options?.unlessCanceled && options?.sustain ||
            options?.once && options?.sustain ||
            options?.once && options?.until ||
            options?.$lifetime && options?.$tilStop ||
            options?.$lifetime && options?.unlessCanceled ||
            options?.$lifetime && options?.until ||
            options?.$lifetime && options?.once
        ) console.warn("Hook has conflicting options. Choose only one callback removal strategy.")
        if (sustain && scheduleCancellation) throw new Error("Option `unlessCanceled` cannot be applied to a sustained hook. Use the `until` option or set the callback to run once with the `once` option");
        if (once && until) throw new Error("Option `until` cannot be applied to a hook op that runs only once. Use the `unlessCanceled` option or sustain the listener with the `sustain` option");
    }

    if (isRemover(callback)) {
        return makePendingCancelOp({
            callback,
            enroll,
            remove
        }) as $ListenerReturn<ONCE, CB, OPT, C, MaybeCB>
    }

    if (once) {
        return makePendingOp({
            callback,
            enroll,
            remove,
            scheduleCancellation
        }) as $ListenerReturn<ONCE, CB, OPT, C, MaybeCB>
    }

    return makeActiveListener({
        callback,
        enroll,
        remove,
        options
    }) as $ListenerReturn<ONCE, CB, OPT, C, MaybeCB>
}


type $ListenerReturn<ONCE, CB extends Callback, OPT, C extends MaybeCB, MaybeCB extends MaybeBadScheduler<OPT, CB>> = ONCE extends {onceAsDefault: true} ? OneTimeListenerReturn<CB, OPT, C, MaybeCB> : SustainedListenerReturn<CB, OPT, C, MaybeCB>


export type SchedulerOptions = {
    unlessCanceled?: ScheduleCancel
}

export type ScheduledOp<CB extends Callback> = CB extends { isRemover: true } ? PendingCancelOp : PendingOp<ReturnType<CB>>

export function $schedule<
    CB extends Callback,
    R,
    Arg extends R extends void ? Callback : R
>(callback: CB, options: SchedulerOptions | undefined, config: {
    enroll: (cb: Callback) => R,
    remove: (cbOrReturnVal: Arg) => void
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
        scheduleCancellation: options?.unlessCanceled
    }) as ScheduledOp<CB>
}

function isRemover(callback: Callback) {
    return "isRemover" in callback && callback.isRemover;
}


// export function initAutoCancel(cancel: CallbackRemover<void>) {
//     let success: false | PendingCancelOp = schedulingSceneCleanup ? existingPendingAutoCleanup! : false;
//     if (settingUpScene) {
//         if (!unattachedScene && !schedulingAutoCleanup)
//             success = scheduleAutoCleanup(cancel);
//     }
//     else if (!schedulingAutoCleanup) return scheduleAutoCleanup(cancel);
// }

// export function initSceneAutoCancel(cancel: CallbackRemover<void>){
//     let success: false | PendingCancelOp = schedulingSceneCleanup ? existingPendingSceneCleanup! : false;
//     if (settingUpScene && !schedulingSceneCleanup) {
//        success = scheduleSceneCleanup(cancel);
//     }
//     return success;
// }


export function initAutoCleanup(stop: CallbackRemover<void>) {
    let success: void | PendingCancelOp = schedulingSceneCleanup ? existingPendingAutoCleanup! : undefined;
    if (settingUpScene) {
        if (!unattachedScene && !schedulingAutoCleanup)
            success = scheduleAutoCleanup(stop);
    }
    else {
        success = schedulingAutoCleanup ? existingPendingAutoCleanup! : scheduleAutoCleanup(stop);
    }
    return success;
}

export function initSceneAutoCleanup(stop: CallbackRemover<void>) {
    let success: void | PendingCancelOp = schedulingSceneCleanup ? existingPendingSceneCleanup! : undefined;
    if (settingUpScene && !schedulingSceneCleanup) {
        success = scheduleSceneCleanup(stop);
    }
    return success;
}



export function $subscribe<
    CB extends Callback,
    RET,
    ARG extends RET extends void ? CB : RET,
    OPT extends ListenerOptions | undefined,
    C extends MaybeCB,
    MaybeCB extends MaybeBadScheduler<OPT, CB>,
>(callback: CB, options: OPT, config: {
    enroll: (callback: Callback) => RET,
    remove: (cbOrReturnVal: ARG) => void
}): SustainedListenerReturn<CB, OPT, C, MaybeCB> {

    const { enroll, remove } = config;

    if (isRemover(callback)) {
        return makePendingCancelOp({
            callback,
            enroll,
            remove
        }) as SustainedListenerReturn<CB, OPT, C, MaybeCB>
    }

    return makeActiveListener({
        callback,
        enroll,
        remove,
        options
    }) as SustainedListenerReturn<CB, OPT, C, MaybeCB>
}