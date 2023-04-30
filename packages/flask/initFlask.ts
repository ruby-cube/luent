import { PendingOp } from "./PendingOp";
import { CovertFlask, CovertFlaskConfig, _setCovertFlaskConfigs, } from "./CovertFlasks"
import { Callback } from "./flaskedListeners";

export function initFlask(config: {
    covertFlasks: {
        targetGetter: () => any;
        onSetupEnd: (this: CovertFlask, callback: Callback) => any;
        autoCleanupScheduler: (this: CovertFlask, cleanup: () => void) => PendingOp;
    }[]
}) {
    _setCovertFlaskConfigs(config.covertFlasks);
}


// initFlask({
//     covertFlasks: [
//         {
//         }

//     ]
// })