import { Callback, ListenerOptions } from "./flaskableListeners";
import { bindFlask, getFlask, onFlaskDisposal } from "./flask";
import { PendingCancelOp } from "./PendingCancelOp";
import { genIncrementalId, markNoCleanup, setUpCleanupWarning, shouldWarnNoCleanup, unmarkNoCleanup } from "./initFlask";

export type ActiveListener = {
    stop(): void;
}


export type EnrollFunction = (wrappedCB: Callback) => any
export type RemoveFunction<E extends EnrollFunction> =
    E extends (arg: any) => infer R ?
    R extends Callback ?
    (cleanUp: R) => void
    : (forRemoval: R) => void
    : never

type ActiveListenerConfig<E extends EnrollFunction = EnrollFunction> = {
    callback: Callback,
    enroll: E,
    remove: RemoveFunction<E>,
    options: ListenerOptions | undefined
}

export function makeActiveListener<E extends (wrappedCB: Callback) => void | Callback>(
    config: ActiveListenerConfig<E>
): ActiveListener {
    const { enroll, remove, callback, options } = config;
    if (!callback) {
        if (__DEV__) console.warn("No callback was passed into makeActiveListener")
        return { stop: () => { } };
    }
    const once = options?.once;
    const flask = options?.flask;


    let returnVal: any;
    let pendingStop: PendingCancelOp | undefined
    let pendingFlaskCleanup: PendingCancelOp | undefined

    const activeListener = {
        stop: _remove
    }

    const _callback = bindFlask(once ? oneTimeCallback : callback, flask === 'outlive' ? null : flask);

    function oneTimeCallback(...args: any[]) {
        try {
            callback(...args);
        }
        finally {
            _remove()
        }
    }

    let callCount = 0;
    function _remove() {
        if (callCount !== 0) return;
        callCount++;
        try {
            remove(returnVal ?? _callback);
            if (__DEV__) unmarkNoCleanup(activeListener);
        }
        finally {
            if (pendingStop && 'cancel' in pendingStop) pendingStop.cancel();
            if (pendingFlaskCleanup && 'cancel' in pendingFlaskCleanup) pendingFlaskCleanup.cancel();
        }
    }
    _remove.isRemover = true as const;

    const until = options?.until || null;

    if (until) {
        pendingStop = until(_remove);
        if (__DEV__ && (!pendingStop || pendingStop && !("cancel" in pendingStop)))
            console.warn('`until` function should be a flaskable scheduler that return a PendingCancelOp for cleanup. See @rue/flask')
    }

    pendingFlaskCleanup =
        flask && flask !== "outlive" ? flask.onDisposal(_remove)
            : flask === 'outlive' ? undefined
                : onFlaskDisposal(_remove);

    if (__DEV__ && flask !== "outlive") setUpCleanupWarning!(activeListener, until, flask || getFlask())

    try {
        returnVal = enroll(_callback);
    }
    finally {
        return activeListener as ActiveListener;
    }
}