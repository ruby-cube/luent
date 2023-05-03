import { ActiveListener, Callback, PendingCancelOp, PendingOp } from ".";
import { Flask } from "./flask";
import { registerGlobalResetter } from "../dev/__resetGlobals";



export class CovertFlask implements Flask {
    entity: any
    onDisposed: (this: CovertFlask, cb: () => void) => PendingCancelOp;
    constructor(entity: any, private entityGetter: () => any, autoCleanupScheduler: (this: CovertFlask, cb: () => void) => PendingCancelOp) {
        this.entity = entity;
        this.onDisposed = autoCleanupScheduler;
    }
    async after<T>(promise: Promise<T>) {
        if (__DEV__) {
            if (this.entityGetter() !== this.entity || activeCovertFlask !== this) {
                throw new Error(`covertFlask.after() called outside of covert flask setup.`)
            }
        }
        _closeSetup();
        try {
            const result = await promise
            return [result, null]
        }
        catch (err) {
            return [null, err]
        }
        finally {
            _resumeSetup(this);
        }
    }
}

export type CovertFlaskConfig = {
    entityGetter: () => any;
    autoCleanupScheduler: (this: CovertFlask, callback: Callback) => PendingOp;
};

export type CovertFlaskConfigs = {
    entityGetter: () => any;
    autoCleanupScheduler: (this: CovertFlask, callback: Callback) => PendingOp;
}[];



// _registerCovertFlasks([ 
//     {
//         entityGetter: getCurrentInstance,
//         autoCleanupScheduler(this: CovertFlask, cleanup: () => void) {
//             return onUnmounted(cleanup, { target: this.target })
//         }
//     },
//     {
//         setupChecker: inComponentSetup,
//         autoCleanupScheduler: onUnmounted
//     }
// ])

// defineAutoCleanup((cleanup) => {
//     if (isMakingModel()) {
//         console.log("scheduling auto cleanup")
//         return onDestroyed(cleanup);
//     }
// })

// export const _covertFlaskClasses = new Map();




//NOTE: Because activeCovertFlask is not set at the start of setup or unset at the end of setup, 
// it should not be used to check for the activeCovertFlask. It's only used here to restore the covert flask
// after awaiting a promise.

export let _covertFlaskConfigs: CovertFlaskConfigs | null = null;
export function _setCovertFlaskConfigs(covertFlaskConfigs: CovertFlaskConfigs){
    _covertFlaskConfigs = covertFlaskConfigs
}
if (__TEST__) registerGlobalResetter(() => _covertFlaskConfigs = null)

let activeCovertFlask: CovertFlask | null | undefined;

export function getCovertFlask() {
    if (_covertFlaskConfigs)
        for (const { entityGetter, autoCleanupScheduler } of _covertFlaskConfigs) {
            const entity = entityGetter();
            if (entity) {
                if (activeCovertFlask?.entity === entity) return activeCovertFlask;
                activeCovertFlask = new CovertFlask(entity, entityGetter, autoCleanupScheduler) as CovertFlask;
                return activeCovertFlask;
            }
            else {
                return activeCovertFlask;
            }
        }
}

export function _inCovertFlaskSetup() {
    if (_covertFlaskConfigs)
        for (const { entityGetter } of _covertFlaskConfigs) {
            const entity = entityGetter();
            if (entity) {
                return true;
            }
            else {
                return !!activeCovertFlask;
            }
        }
}

function _resumeSetup(flask: CovertFlask) {
    activeCovertFlask = flask;
}

function _closeSetup() {
    activeCovertFlask = null;
}