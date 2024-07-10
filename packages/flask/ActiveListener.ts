import { survivingRemovers } from "./outlive";
import { Callback, initAutoCleanup, ListenerOptions, PendingCancelOp } from "./flaskedListeners";

export type ActiveListener = {
    stop(): void;
}

export function makeActiveListener<R, Arg extends R extends void ? Callback : R, CB extends Callback>(
    config: {
        callback: CB,
        enroll: (callback: CB) => R,
        remove: (cbOrReturnVal: Arg) => void,
        options: ListenerOptions | undefined
    }
) {
    const { enroll, remove, callback, options } = config;
    const until = options?.until || null;
    const outlive = options?.outlive;
    let returnVal: any;
    let pendingAutoStops: PendingCancelOp[] | void;
    let pendingStop: PendingCancelOp | undefined
    // let pendingSceneStop: PendingCancelOp | void;
    const stop = () => {
        remove(returnVal ?? callback);
        if (pendingStop) pendingStop.cancel();
        if (outlive) survivingRemovers.delete(stop);
        else if (pendingAutoStops) {
            for (const cleanup of pendingAutoStops){
                cleanup.cancel();
            }
        }
    }
    stop.isRemover = true as const;
    if (until) {
        if (outlive) survivingRemovers.add(stop);
        pendingStop = until(stop);
    }
    returnVal = enroll(callback);

    if (!outlive) {
        var success = pendingAutoStops = initAutoCleanup(stop);
    }

    if (__DEV__) {
        const { until, once } = options || {};
        if (
            // !pendingSceneStop && 
            !success && !once && !until) {
            console.warn("This listener doesn't have a callback removal strategy (run once, run until, or auto cleanup). This is considered a memory leak if this listener is not intended to last the lifetime of the app. Check if auto cleanup callback returns a success flag")
            console.trace();
        }
    }

    return {
        stop
    } as ActiveListener
}
