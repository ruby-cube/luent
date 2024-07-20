import { addToFlask } from "./flask";

export type PendingCancelOp = {
    cancel: () => void;
}

export function makePendingCancelOp(config: {
    callback: () => void,
    enroll: (cb: () => void) => any,
    remove: (cbOrReturnVal: any) => void
}): PendingCancelOp {
    const { callback, enroll, remove } = config
    let returnVal: any;

    const _callback = () => {
        callback();
        remove(returnVal ?? _callback); // will only be called once
    }

    try {
        returnVal = enroll(_callback);
    }
    finally {
        const cancel = () => {
            remove(returnVal ?? _callback);
        }
        cancel.isRemover = true as const;

        addToFlask(cancel)

        return {
            cancel
        }
    }

}