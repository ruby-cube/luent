import { CallbackRemover, PendingCancelOp } from "@rue/planify";
import {Scene} from "./Scene"


export let scheduleSceneCleanup: (stop: CallbackRemover<void>) => PendingCancelOp;
export let schedulingSceneCleanup = false; // to prevent infinite loop of auto cleanup listener
export let existingPendingSceneCleanup: PendingCancelOp | null;

export function registerSceneCleanup(scene: Scene) {
    scheduleSceneCleanup = (stop) => {
        schedulingSceneCleanup = true;
        const pendingCancelOp = existingPendingSceneCleanup = scene.onEnded(stop)
        schedulingSceneCleanup = false;
        existingPendingSceneCleanup = null;
        return pendingCancelOp;
    }
}