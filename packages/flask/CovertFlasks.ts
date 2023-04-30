import { ActiveListener, Callback, PendingCancelOp, PendingOp } from ".";
import { getCurrentInstance } from "vue";
import { ReactivityFlask } from "./flask";
import { registerGlobalResetter } from "../dev/__resetGlobals";



export class CovertFlask implements ReactivityFlask {
    target: any
    onDisposed: (this: CovertFlask, cb: () => void) => PendingCancelOp;
    onSetupEnd: (this: CovertFlask, callback: Callback) => any;
    constructor(target: any, private targetGetter: () => any, autoCleanupScheduler: (this: CovertFlask, cb: () => void) => PendingCancelOp, onSetupEnd: (this: CovertFlask, callback: Callback) => any) {
        this.target = target;
        this.onDisposed = autoCleanupScheduler;
        this.onSetupEnd = onSetupEnd
    }
    async after<T>(promise: Promise<T>) {
        if (__DEV__) {
            if (this.targetGetter() !== this.target || activeCovertFlask !== this) {
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
    targetGetter: () => any;
    onSetupEnd: (this: CovertFlask, callback: Callback) => any;
    autoCleanupScheduler: (this: CovertFlask, callback: Callback) => PendingOp;
};

export type CovertFlaskConfigs = {
    targetGetter: () => any;
    onSetupEnd: (this: CovertFlask, callback: Callback) => any;
    autoCleanupScheduler: (this: CovertFlask, callback: Callback) => PendingOp;
}[];



// _registerCovertFlasks([ 
//     {
//         targetGetter: getCurrentInstance,
//         autoCleanupScheduler(this: CovertFlask, cleanup: () => void) {
//             return onComponentUnmounted(cleanup, { target: this.target })
//         }
//     },
//     {
//         setupChecker: inComponentSetup,
//         autoCleanupScheduler: onComponentUnmounted
//     }
// ])

// defineAutoCleanup((cleanup) => {
//     if (isMakingModel()) {
//         console.log("scheduling auto cleanup")
//         return onDestroyed(cleanup);
//     }
// })

// export const _covertFlaskClasses = new Map();


// export function _declareCovertFlaskClasses(covertFlaskConfigs: CovertFlaskConfigs) {
//     for (const { targetGetter, onSetupEnd, autoCleanupScheduler } of covertFlaskConfigs) {

//         _covertFlaskClasses.set(targetGetter, _CovertFlask);
//     }
// }

//NOTE: Because activeCovertFlask is not set at the start of setup or unset at the end of setup, 
// it should not be used to check for the activeCovertFlask. It's only used here to restore the covert flask
// after awaiting a promise.

export let _covertFlaskConfigs: CovertFlaskConfigs | null = null;
export function _setCovertFlaskConfigs(covertFlaskConfigs: CovertFlaskConfigs){
    _covertFlaskConfigs = covertFlaskConfigs
}
if (__TEST__) registerGlobalResetter(() => _covertFlaskConfigs = null)

let activeCovertFlask: CovertFlask | null | undefined;

export function _getCovertFlask() {
    if (_covertFlaskConfigs)
        for (const { targetGetter, onSetupEnd, autoCleanupScheduler } of _covertFlaskConfigs) {
            const target = targetGetter();
            if (target) {
                if (activeCovertFlask?.target === target) return activeCovertFlask;
                activeCovertFlask = new CovertFlask(target, targetGetter, onSetupEnd, autoCleanupScheduler) as CovertFlask;
                activeCovertFlask.onSetupEnd(_closeSetup);
                return activeCovertFlask;
            }
            else {
                return activeCovertFlask;
            }
        }
}

export function _inCovertFlaskSetup() {
    if (_covertFlaskConfigs)
        for (const { targetGetter } of _covertFlaskConfigs) {
            const target = targetGetter();
            if (target) {
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