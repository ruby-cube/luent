import { PendingOp } from "./PendingOp";
import { RootFlask, RootFlaskConfig, _declareRootFlaskClasses } from "./RootFlasks"
import { ActiveListener } from "./flaskedListeners";

export function initFlask(config: {
    rootFlasks: ({
        setupChecker: () => boolean;
        autoCleanupScheduler: (cleanup: () => void) => PendingOp | ActiveListener;
    } | {
        targetGetter: () => any;
        autoCleanupScheduler: (this: RootFlask, cleanup: () => void) => PendingOp | ActiveListener;
    })[]
}) {
    _declareRootFlaskClasses(config.rootFlasks);
}


// initFlask({
//     rootFlasks: [
//         {
//         }

//     ]
// })