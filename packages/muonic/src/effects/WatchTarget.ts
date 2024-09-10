import { SetMap } from "@rue/utils";
import { onPhaseCompleted, Phase, useUpdateCycle } from "./UpdateCycle";
import { runEffect } from "./watch";
import { getDependencyTracker } from "../derivations/DependencyTracker";
import { Watchable } from "./Watchable";


export type Effect = (...args: any[]) => void;

export class WatchTarget<T extends Watchable = Watchable> {

    constructor(public target: T) {
        this.effects = new SetMap()
        target.watch(this)
    }

    watchCount = 0
    private nextCycleEffects: SetMap<Phase, Effect> | undefined;
    private effects: SetMap<Phase, Effect>;

    private initializeNextCycleEffects() {
        this.nextCycleEffects = new SetMap()
    }

    private queueForNextCycle(effect: Effect, phase: Phase) {
        if (!this.nextCycleEffects) this.initializeNextCycleEffects()
        this.nextCycleEffects!.addToSet(effect, phase)
        const toBeQueued = this.nextCycleEffects?.get(phase);
        if (!toBeQueued) return;
        const mustSetUpQueueTransfer = toBeQueued.size > 0;

        if (mustSetUpQueueTransfer) {
            onPhaseCompleted(phase, () => {
                for (const effect of toBeQueued!) {
                    this.effects.addToSet(effect, phase)
                }
                toBeQueued.clear()
            })
        }
    }

    private queueEffect(effect: Effect, phase: Phase) {
        this.effects.addToSet(effect, phase)
    }
    
    private removeEffect(effect: Effect, phase: Phase) {
        this.effects.removeFromSet(effect, phase)
    }
    
    watch(effect: Effect, phase: Phase, forNextCycle: boolean){
        if (forNextCycle) {
            this.queueForNextCycle(effect, phase)
        }
        else {
            this.queueEffect(effect, phase)
        }
        this.watchCount++;
    }
    
    unwatch(effect: Effect, phase: Phase){
        this.removeEffect(effect, phase)
        this.watchCount--
        if (this.watchCount === 0){
            this.target.unwatch()
        }

        this.emitUnwatched()
    }

    triggerEffects() {
        for (const [phase, effects] of this.effects) {
            if (phase === 'sync') {
                this.runSyncEffects(effects);
            }
            else {
                this.scheduleEffects(effects, phase)
            }
        }
    }

    private runSyncEffects(effects: Set<Effect>) {
        const tracker = getDependencyTracker();
        tracker?.stop(); // in case reactive refs are triggered during a reactiveEffect
        for (const effect of effects) {
            runEffect(effect)
        }
        tracker?.restore();
    }

    private scheduleEffects(effects: Set<Effect>, phase: Phase) {
        const updateCycle = useUpdateCycle()
        for (const effect of effects) {
            updateCycle.scheduleEffect(this.target, effect, phase)
        }
    }

    private cleanUp?: () => void

    onUnwatched(cleanUp: () => void) {
        if (__DEV__ && this.cleanUp) {
            console.error('Overriding existing cleanup function. This means we need an array for onUnwatched tasks')
        }
        this.cleanUp = cleanUp;
    }

    private emitUnwatched() {
        this.cleanUp?.()
    }
}


export function isWatched(target: Watchable | null | undefined) {
    if (!target) return false;
    return Boolean(target.asWatchTarget);
}

export function asWatchTarget(target: Watchable): WatchTarget {
    let watchTarget = target.asWatchTarget;
    if (!watchTarget) {
        watchTarget = new WatchTarget(target)
    }
    return watchTarget;
}