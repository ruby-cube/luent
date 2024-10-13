import { Callback, CallbackRemover } from "./flaskableListeners";
import { getFlask, onFlaskDisposal } from "./EffectFlask";
import { PendingCancelOp } from "./PendingCancelOp";
import { setUpCleanupWarning, unmarkNoCleanup } from "./initFlask";
import { mapHandlers } from "./handlerMap";

export type ActiveListener = {
    stop(): void;
}

export type ScheduleStop = (stop: CallbackRemover) => PendingCancelOp;

export const LIFETIME = null;

export type ListenerOptions = {
    once?: boolean;
    until?: ScheduleStop | typeof LIFETIME;
    // flask?: EffectFlask | null | 'outlive';
    __devName?: string;
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
    // const flask = options?.flask;


    let returnVal: any;
    let pendingStop: PendingCancelOp | undefined
    let pendingFlaskCleanup: PendingCancelOp | undefined

    const activeListener = {
        stop: _remove
    }

    const _callback = once ? oneTimeCallback : callback;
    // const _callback = bindFlask(once ? oneTimeCallback : callback, flask === 'outlive' ? null : flask);

    mapHandlers(_callback, callback);

    function oneTimeCallback(...args: any[]) {
        callback(...args);
        _remove()
    }

    let called = false;
    function _remove() {
        if (called) return;
        remove(returnVal ?? _callback);
        called = true;
        if (__DEV__) unmarkNoCleanup(activeListener);
        if (pendingStop && 'cancel' in pendingStop) pendingStop.cancel();
        else if (pendingFlaskCleanup && 'cancel' in pendingFlaskCleanup) {
            pendingFlaskCleanup.cancel();
        }
        // console.log('remove done', pendingFlaskCleanup)
    }
    _remove.isRemover = true as const;
    _remove.__devName = options?.__devName;

    const until = options?.until;

    if (until) {
        pendingStop = until(_remove);
        if (__DEV__ && (!pendingStop || pendingStop && !("cancel" in pendingStop)))
            console.warn('`until` function should be a flaskable scheduler that return a PendingCancelOp for cleanup. See @rue/flask')
    }
    else if (until !== LIFETIME) {
        pendingFlaskCleanup = onFlaskDisposal(_remove);
    }

    // pendingFlaskCleanup =
    //     flask && flask !== "outlive" ? flask.onDisposal(_remove)
    //         : flask === 'outlive' ? undefined
    //             : onFlaskDisposal(_remove);
    // console.log('pendingFlaskCleanup', pendingFlaskCleanup)

    if (__DEV__ && until !== LIFETIME) setUpCleanupWarning!(activeListener, until, getFlask())

    returnVal = enroll(_callback);

    return activeListener as ActiveListener;
}