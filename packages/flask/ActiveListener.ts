import { survivingRemovers } from "./outlive";
import { ActiveListener, Callback, initAutoCleanup, initSceneAutoCleanup, ListenerOptions, PendingCancelOp } from "./flaskedListeners";

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
    const outlive = options?.$outlive;
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
        // if (pendingSceneStop) pendingSceneStop.cancel();
    }
    stop.isRemover = true as const;
    if (until) {
        if (outlive) survivingRemovers.add(stop);
        pendingStop = until(stop);
    }
    returnVal = enroll(callback);

    if (!outlive) {
        var success = pendingAutoStops = initAutoCleanup(stop);
        // pendingSceneStop = initSceneAutoCleanup(stop);
    }

    if (__DEV__) {
        const { until, $lifetime, $tilStop, once } = options || {};
        if (
            // !pendingSceneStop && 
            !success && !once && !until && !$lifetime && !$tilStop) {
            console.warn("This listener doesn't have a callback removal strategy (run once, run until, or auto cleanup). This is considered a memory leak if this listener is not intended to last the lifetime of the app. Pass the `$lifetime` or `$tilStop` flag in the options param to prevent this warning. Also check if auto cleanup callback returns a success flag")
            console.trace();
        }
    }

    return {
        stop
    } as ActiveListener
}
