import { PendingOp } from "@rue/planify";
import { getCurrentInstance } from "vue";
import { ReactivityFlask } from "./flask";
import { inComponentSetup, onComponentUnmounted } from "../paravue/component";

export type RootFlask = {
    target: any | null;
} & ReactivityFlask

type RootFlaskConfig = ({
    inFlaskSetup: () => boolean;
    scheduleAutoCleanup: (cleanup: () => void) => PendingOp;
} | {
    getTarget: () => any;
    scheduleAutoCleanup: (this: RootFlask, cleanup: () => void) => PendingOp;
});

let rootFlaskConfigs: RootFlaskConfig[];
function defineRootFlasks(rootFlaskDefs: RootFlaskConfig[]) {
    rootFlaskConfigs = rootFlaskDefs
}

defineRootFlasks([ 
    {
        getTarget: getCurrentInstance,
        scheduleAutoCleanup(this: RootFlask, cleanup: () => void) {
            return onComponentUnmounted(cleanup, { target: this.target })
        }
    },
    {
        inFlaskSetup: inComponentSetup,
        scheduleAutoCleanup: onComponentUnmounted
    }
])

// defineAutoCleanup((cleanup) => {
//     if (isMakingModel()) {
//         console.log("scheduling auto cleanup")
//         return onDestroyed(cleanup);
//     }
// })

export const _rootFlaskClasses = new Map();
function defineRootFlaskClasses() {
    for (const { getTarget, scheduleAutoCleanup } of rootFlaskConfigs) {
        class RootFlask {
            target: any
            onDisposed: (this: RootFlask, cb: () => void) => void
            constructor(target: RootFlask) {
                this.target = target;
                this.onDisposed = scheduleAutoCleanup;
            }
        }
        _rootFlaskClasses.set(getTarget, RootFlask);
    }
}

