import { CallbackRemover, PendingCancelOp } from ".";
import { Scene } from "./Scene"


export let scheduleSceneCleanup: ((stop: CallbackRemover<void>) => PendingCancelOp) | null;
export let schedulingSceneCleanup = false; // to prevent infinite loop of auto cleanup listener
export let existingPendingSceneCleanup: PendingCancelOp | null;

export function registerSceneCleanup(scene: Scene | null | undefined) {
    if (scene) {
        scheduleSceneCleanup = (stop) => {
            schedulingSceneCleanup = true;
            const pendingCancelOp = existingPendingSceneCleanup = scene.onEnded(stop)
            schedulingSceneCleanup = false;
            existingPendingSceneCleanup = null;
            return pendingCancelOp;
        }
    }
    else {
        scheduleSceneCleanup = null;
    }
}