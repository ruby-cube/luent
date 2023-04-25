import { CallbackRemover, PendingCancelOp } from "@rue/planify";
import type { SceneEndListener } from "./Scene";


export let scheduleSceneCleanup: (stop: CallbackRemover<void>) => PendingCancelOp;
export let schedulingSceneCleanup = false; // to prevent infinite loop of auto cleanup listener
export let existingPendingSceneCleanup: PendingCancelOp | null;

export function registerCleanupScheduler(cleanupScheduler: SceneEndListener) {
    scheduleSceneCleanup = (stop) => {
        schedulingSceneCleanup = true;
        const pendingCancelOp = existingPendingSceneCleanup = cleanupScheduler(stop)
        schedulingSceneCleanup = false;
        existingPendingSceneCleanup = null;
        return pendingCancelOp;
    }
}