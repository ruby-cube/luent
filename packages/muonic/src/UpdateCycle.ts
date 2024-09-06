import { beforeRepaint, queueTask } from "@rue/thread";
import { ReactiveAtom } from "./ReactiveAtom";
import { $schedule, ScheduleCancel, SchedulerOptions, unwrap } from "@rue/flask";
import { Effect } from "./WatchTarget";
import { SetMap, UNDEFINED } from "@rue/utils";
import { AnyObject } from "@rue/types";
import { MutationRecord } from "./deepWatch";
import { areEqual } from "./areEqual";
import { DerivedSignal } from "./DerivedSignal";
import { isReactiveModel, ReactiveModel } from "./Reactive$";
import { SnapshotManager } from "./SnapshotManager";

type ReactiveTarget = ReactiveAtom | DerivedSignal | ReactiveModel

export type Phase = 'pre' | 'render' | 'post' | 'sync'

const snapshotManager = new SnapshotManager();

let updateCycleCount = -1;

let currentUpdateCycle: UpdateCycle | undefined;

export function getCurrentUpdateCycle() {
    return currentUpdateCycle;
}

export function useUpdateCycle() {
    let updateCycle = getCurrentUpdateCycle()
    if (!updateCycle) {
        updateCycle = new UpdateCycle();

    }
    return updateCycle;
}

export function startUpdateCycle(updateCycle: UpdateCycle) {
    if (currentUpdateCycle)
        throw new Error("Overlapping update cycles! Need to either implement a different type of update cycle management system or set up guards to prevent overlaps")
    return currentUpdateCycle = updateCycle;
}

export function endUpdateCycle() {
    currentUpdateCycle = undefined;
}

export class UpdateCycle {

    //TODO: Manage snapshots and ops

    constructor() {
        startUpdateCycle(this)
        updateCycleCount++;
        beforeRepaint(() => {
            this.runEffects('render');
            this.runTasks(Hooks.ON_RENDERED)
            queueTask(() => {
                this.runEffects('post');
                this.runTasks(Hooks.ON_UPDATE_COMPLETED)
                endUpdateCycle();
            }, { __devName: queueTask.name })
        }, { __devName: beforeRepaint.name })
    }

    snapshotMap: Map<ReactiveModel, AnyObject> | undefined;

    takeSnapshot(reactive: ReactiveModel, target: AnyObject, clone?: AnyObject) {
        let snapshotMap = this.snapshotMap;
        if (!snapshotMap) {
            snapshotMap = new Map();
            this.snapshotMap = snapshotMap;
        }
        if (snapshotMap.has(reactive))
            return snapshotMap.get(reactive)!; // snapshot of original state already taken for this cycle, no need to take another
        const _snapshot = snapshotManager.takeSnapshot(target, updateCycleCount, clone)
        snapshotMap.set(reactive, _snapshot) // snapshots are shallow clones!
        return _snapshot;
    }

    getSnapshot(reactive: ReactiveModel) {
        const snapshotMap = this.snapshotMap;
        if (!snapshotMap) return null;
        const snapshot = snapshotMap.get(reactive)
        if (!snapshot) return null;
        return snapshot
    }

    opsMap: WeakMap<ReactiveModel, MutationRecord[]> = new WeakMap();

    composeOps(target: ReactiveModel, ops: MutationRecord[]) {
        let existingOps = this.opsMap.get(target);
        if (existingOps) {
            existingOps.push(...ops)
        }
        else {
            this.opsMap.set(target, ops);
        }
    }

    recordOp(target: ReactiveModel, op: MutationRecord) {

        //TODO: consolidate set ops (cannot consolidate mutation ops, those need to be in order)
        let existingOps = this.opsMap.get(target);
        if (existingOps) {
            existingOps.push(op)
        }
        else {
            this.opsMap.set(target, [op]);
        }
    }

    getOps(target: ReactiveModel) {
        return this.opsMap.get(target)
    }


    // INITIAL VALUES

    initialValues: Map<ReactiveTarget, any> = new Map();

    storeInitialValue(target: ReactiveTarget, value: any) {
        const intialValue = this.getInitialValue(target);
        if (intialValue !== UNDEFINED) return; // initial value already stored
        this.initialValues.set(target, value);
    }

    getInitialValue(target: ReactiveTarget) {
        if (!this.initialValues.has(target)) return UNDEFINED;
        return this.initialValues.get(target);
    }

    // EFFECTS

    effects: SetMap<Phase, Effect> = new SetMap();
    reactiveEffects: SetMap<Phase, Effect> = new SetMap();

    targetMap: SetMap<Effect, ReactiveTarget> = new SetMap();

    scheduleEffect(target: ReactiveTarget, effect: Effect, phase: Phase) {
        if (target === unwrap(effect)) {
            this.reactiveEffects.addToSet(effect, phase)
        }
        else {
            this.targetMap.addToSet(target, effect)
            this.effects.addToSet(effect, phase)
        }
    }

    runEffects(phase: Phase) {
        const effects = this.effects.get(phase);
        if (effects) {
            for (const effect of effects) {
                const targets = this.targetMap.get(effect);
                if (targets) {
                    for (const target of targets) {
                        const oldValue = this.getInitialValue(target);
                        const newValue = getCurrentValue(target);
                        if (!areEqual(newValue, oldValue)) {
                            effect(newValue, oldValue)
                        }
                    }
                }
            }
        }
        const reactiveEffects = this.reactiveEffects.get(phase)
        if (reactiveEffects) {
            for (const effect of reactiveEffects) {
                effect();
            }
        }
    }

    // TASKS

    tasks: {
        [Hooks.BEFORE_RENDER]: Set<Function>,
        [Hooks.ON_RENDERED]: Set<Function>,
        [Hooks.AFTER_PRERENDER_PHASE]: Set<Function>,
        [Hooks.ON_UPDATE_COMPLETED]: Set<Function>,
    } = {
            [Hooks.BEFORE_RENDER]: new Set(),
            [Hooks.ON_RENDERED]: new Set(),
            [Hooks.AFTER_PRERENDER_PHASE]: new Set(),
            [Hooks.ON_UPDATE_COMPLETED]: new Set(),
        }


        runTasks(hookName: Hooks) {
            const tasks = getCurrentUpdateCycle()?.tasks;
            if (!tasks) return;
            const _tasks = tasks[hookName]
            for (const task of _tasks) {
                task();
            }
        }
}

function getCurrentValue(target: ReactiveTarget) {
    if (target instanceof Function) {
        return target()
    }
    else if (isReactiveModel(target)) {
        return target;
    }
}



export enum Hooks {
    AFTER_PRERENDER_PHASE = "oppc",
    BEFORE_RENDER = "br",
    ON_RENDERED = "or",
    ON_UPDATE_COMPLETED = "uc"
}


// const updateCompletedTasks: (() => void)[] = [];


function createUpdateCycleHook(hookName: Hooks) {
    return (task: () => void, options?: { cancel?: ScheduleCancel; __devName?: string}) => {
        const _options = <SchedulerOptions>options || { flask: '' }
        _options.flask = 'outlive'
        return $schedule(task, _options, {
            enroll(task) {
                const tasks = getCurrentUpdateCycle()?.tasks;
                if (!tasks) throw new Error('No update cycle :(. This should never happen')
                tasks[hookName].add(task)
            },
            remove(task) {
                const tasks = getCurrentUpdateCycle()?.tasks;
                if (!tasks) throw new Error('No update cycle :(. This should never happen')
                tasks[hookName].delete(task)
            }
        })
    }
}

export const onRendered = createUpdateCycleHook(Hooks.ON_RENDERED)
export const beforeRender = createUpdateCycleHook(Hooks.BEFORE_RENDER)
export const afterPrerenderPhase = createUpdateCycleHook(Hooks.AFTER_PRERENDER_PHASE)
export const onUpdateCompleted = createUpdateCycleHook(Hooks.ON_UPDATE_COMPLETED)

export function onPhaseCompleted(phase: Phase, handler: () => void) {
    if (phase === 'pre') {
        afterPrerenderPhase(handler)
    }
    else if (phase === 'render') {
        onRendered(handler)
    }
    else if (phase === 'post') {
        onUpdateCompleted(handler)

    }
    else if (phase === 'sync') {
        throw new Error("This should never happen. There is no after sync phase hook")
    }
}


export function runPrerenderEffectsAndTasks(){
        const updateCycle = getCurrentUpdateCycle()
        if (updateCycle){
            updateCycle.runEffects('pre');
            updateCycle.runTasks(Hooks.AFTER_PRERENDER_PHASE)
        }
}