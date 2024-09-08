import { SetMap } from "@rue/utils";
import { onPhaseCompleted, Phase, useUpdateCycle } from "./UpdateCycle";
import { ReactiveAtom } from "../derivations/ReactiveAtom";
import { ReactiveModel } from "../reactivemodel/Reactive$";
import { DerivedSignal, isDerivedSignal } from "../derivations/DerivedSignal";
import { ReactiveEffect, runEffect } from "./watch";
import { getDependencyTracker } from "../derivations/DependencyTracker";
import { ReactiveProp } from "../reactivemodel/ReactiveProp";
import { ReactiveFunction } from "../derivations/ReactiveFunction";


export type Effect = (...args: any[]) => void;

export class WatchTarget<T extends ReactiveProp | ReactiveAtom | ReactiveModel | DerivedSignal | ReactiveEffect | ReactiveFunction = ReactiveProp | ReactiveAtom | ReactiveModel | DerivedSignal | ReactiveEffect | ReactiveFunction> {

    constructor(public target: T) { }

    watchCount = 0
    nextCycleEffects: SetMap<Phase, Effect> | undefined;
    effects: SetMap<Phase, Effect> = new SetMap()

    initializeNextCycleEffects() {
        this.nextCycleEffects = new SetMap()
    }

    queueForNextCycle(effect: Effect, phase: Phase) {
        if (!this.nextCycleEffects) this.initializeNextCycleEffects()
        this.nextCycleEffects!.addToSet(effect, phase)
        this.watchCount++;
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

    queueEffect(effect: Effect, phase: Phase) {
        this.effects.addToSet(effect, phase)
        this.watchCount++;
    }

    removeEffect(effect: Effect, phase: Phase) {
        this.effects.removeFromSet(effect, phase)
        this.watchCount--
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

    runSyncEffects(effects: Set<Effect>) {
        const tracker = getDependencyTracker();
        tracker?.stop(); // in case reactive refs are triggered during a reactiveEffect
        for (const effect of effects) {
            runEffect(effect)
        }
        tracker?.restore();
    }

    scheduleEffects(effects: Set<Effect>, phase: Phase) {
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

    emitUnwatched() {
        this.cleanUp?.()
    }
}


