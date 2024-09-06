import { SetMap } from "@rue/utils";
import { onPhaseCompleted, Phase, useUpdateCycle } from "./UpdateCycle";
import { ReactiveAtom } from "../derivations/ReactiveAtom";
import { ReactiveModel } from "../reactivemodel/Reactive$";
import { DerivedSignal, isDerivedSignal } from "../derivations/DerivedSignal";
import { ReactiveEffect } from "./watch";
import { getDependencyTracker } from "../derivations/DependencyTracker";


export type Effect = (...args: any[]) => void;
export type ReactiveGetter = () => any

export class WatchTarget<T extends ReactiveAtom | ReactiveModel | DerivedSignal | ReactiveEffect | ReactiveGetter = ReactiveAtom | ReactiveModel | DerivedSignal | ReactiveEffect | ReactiveGetter> {

    constructor(public target: T) { }

    nextCycleEffects: SetMap<Phase, Effect> | undefined;
    effects: SetMap<Phase, Effect> = new SetMap()

    initializeNextCycleEffects() {
        this.nextCycleEffects = new SetMap()
    }

    queueForNextCycle(effect: Effect, phase: Phase) {
        if (!this.nextCycleEffects) this.initializeNextCycleEffects()
        const toBeQueued = this.nextCycleEffects?.get(phase);
        const mustSetUpQueueTransfer = toBeQueued?.size === 0;
        this.nextCycleEffects!.addToSet(effect, phase)

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
    }

    removeEffect(effect: Effect, phase: Phase) {
        this.effects.removeFromSet(effect, phase)
    }

    triggerEffects(...args: any[]) {
        for (const [phase, effects] of this.effects) {
            if (phase === 'sync') {
                this.runSyncEffects(effects, args);
            }
            else {
                this.scheduleEffects(effects, phase)
            }
        }
    }

    runSyncEffects(effects: Set<Effect>, args: any[]) {
        const tracker = getDependencyTracker();
        tracker?.stop(); // in case reactive refs are triggered during a reactiveEffect
        for (const effect of effects) {
            effect(...args)
        }
        tracker?.restore();
    }

    scheduleEffects(effects: Set<Effect>, phase: Phase) {
        const updateCycle = useUpdateCycle()
        for (const effect of effects) {
            updateCycle.scheduleEffect(this.target, effect, phase)
        }
    }
}


