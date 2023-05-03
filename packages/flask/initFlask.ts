import { PendingOp } from "./PendingOp";
import { CovertFlask, CovertFlaskConfig, _setCovertFlaskConfigs, } from "./CovertFlasks"

export function initFlask(config: {
    covertFlasks: {
        entityGetter: () => any;
        autoCleanupScheduler: (this: CovertFlask, cleanup: () => void) => PendingOp;
    }[]
}) {
    _setCovertFlaskConfigs(config.covertFlasks);
}
