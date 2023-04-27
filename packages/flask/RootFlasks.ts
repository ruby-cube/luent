import { ActiveListener, PendingOp } from ".";
import { getCurrentInstance } from "vue";
import { ReactivityFlask } from "./flask";
import { inComponentSetup, onComponentUnmounted } from "../paravue/component";

export type RootFlask = {
    target: any | null;
} & ReactivityFlask

export type RootFlaskConfig = ({
    setupChecker: () => boolean;
    autoCleanupScheduler: (cleanup: () => void) => PendingOp;
} | {
    targetGetter: () => any;
    autoCleanupScheduler: (this: RootFlask, cleanup: () => void) => PendingOp;
});

export type RootFlaskConfigs = {
    setupChecker?: () => boolean;
    targetGetter?: () => any;
    autoCleanupScheduler: (this: RootFlask, cleanup: () => void) => PendingOp | ActiveListener;
}[];



// _registerRootFlasks([ 
//     {
//         targetGetter: getCurrentInstance,
//         autoCleanupScheduler(this: RootFlask, cleanup: () => void) {
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

export const _rootFlaskClasses = new Map();
export function _declareRootFlaskClasses(rootFlaskConfigs: RootFlaskConfigs) {
    for (const { targetGetter, setupChecker, autoCleanupScheduler } of rootFlaskConfigs) {
        const flaskCheck = targetGetter || setupChecker;
        class RootFlask {
            target: any
            onDisposed: (this: RootFlask, cb: () => void) => void
            constructor(target: any) {
                this.target = target;
                this.onDisposed = autoCleanupScheduler;
            }
        }
        _rootFlaskClasses.set(flaskCheck, RootFlask);
    }
}

