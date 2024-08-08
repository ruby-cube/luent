import { Callback, ListenerOptions } from "./flaskedListeners";
import { addToFlask, getActiveFlask, bindFlask } from "./flask";
import { PendingCancelOp } from "./PendingCancelOp";

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
    const once = options?.once;
    const outlive = options?.outlive;
    // console.log("MakeActiveListener!")
// console.trace()
    let returnVal: any;

    const _callback = bindFlask(once ? (...args: any[]) => {
        callback(...args);
        remove(returnVal ?? _callback)
    } : callback);

    try {
        returnVal = enroll(_callback);
    }
    finally {
        const until = options?.until || null;
        let pendingStop: PendingCancelOp | undefined

        const stop = () => {
            try {
                remove(returnVal ?? _callback);
            }
            finally {
                if (pendingStop) pendingStop.cancel();
            }
        }
        stop.isRemover = true as const;

        if (until) {
            pendingStop = until(stop);
        }

        if (!outlive) addToFlask(stop);

        return {
            stop
        }
    }
}