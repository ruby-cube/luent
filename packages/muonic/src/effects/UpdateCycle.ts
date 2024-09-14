import { setImmediate, clearImmediate } from "@rue/thread";
import { $schedule, ScheduleCancel, SchedulerOptions, unwrap } from "@rue/flask";
import { SetMap } from "@rue/utils";
import { MutationRecord } from "./deepWatch";
import { getMetaReactive, ReactiveModel } from "../reactivemodel/ReactiveModel";
import { MetaReactiveModel } from "../reactivemodel/MetaReactiveModel";
// import { runEffect } from "./watch";

export type Watchable = any
// AtomicSignal | DerivedSignal | ReactiveFunction  | ReactiveModel | ObservedProp
export type Effect = (...args: any[]) => void;

export type Phase = 'pre' | 'render' | 'post' | 'sync'


let updateCycleCount = -1;

let currentUpdateCycle: UpdateCycle | undefined;
let flushingUpdateCycle: UpdateCycle | undefined;

function startFlushPhase(phase: Phase, updateCycle: UpdateCycle) {
    updateCycle.setPhase(phase);
    flushingUpdateCycle = updateCycle
}

function endFlushPhase(updateCyle: UpdateCycle) {
    updateCyle.endPhase()
    flushingUpdateCycle = undefined
}

export function getCurrentUpdateCycle() {
    return currentUpdateCycle;
}

export function useUpdateCycle() {
    let updateCycle = currentUpdateCycle
    if (!updateCycle) {
        updateCycle = new UpdateCycle();

    }
    return updateCycle;
}

export function getFlushingUpdateCycle() {
    return flushingUpdateCycle;
}



function startCollectingEffects(updateCycle: UpdateCycle) {
    if (currentUpdateCycle)
        throw new Error("Overlapping update cycles! Need to either implement a different type of update cycle management system or set up guards to prevent overlaps")
    return currentUpdateCycle = updateCycle;
}

function endCollectingEffects() {
    currentUpdateCycle = undefined;
}

export class UpdateCycle {
    phase?: Phase = 'sync'
    setPhase(phase: Phase) {
        this.phase = phase
    }
    endPhase() {
        this.phase = undefined
    }
    constructor() {
        updateCycleCount++;
        startCollectingEffects(this)
        queueTask(() => { //QUESTION: Should I wrap in a flask??
            endCollectingEffects();
            startFlushPhase('pre', this)
            this.runEffects('pre');
            this.runTasks(Hooks.AFTER_PRERENDER_PHASE)
            endFlushPhase(this)
            beforeRepaint(() => {
                startFlushPhase('render', this)
                this.runEffects('render');
                this.runTasks(Hooks.ON_RENDERED)
                endFlushPhase(this)
                queueTask(() => {
                    startFlushPhase('post', this)
                    this.runEffects('post');
                    this.runTasks(Hooks.ON_UPDATE_COMPLETED)
                    endFlushPhase(this)
                })
            })
        })
    }

    get count() {
        return updateCycleCount;
    }

    // snapshotMap: Map<ReactiveModel, AnyObject> | undefined;

    // takeSnapshot(reactive: ReactiveModel, target: AnyObject, clone?: AnyObject) {
    //     let snapshotMap = this.snapshotMap;
    //     if (!snapshotMap) {
    //         snapshotMap = new Map();
    //         this.snapshotMap = snapshotMap;
    //     }
    //     if (snapshotMap.has(reactive))
    //         return snapshotMap.get(reactive)!; // snapshot of original state already taken for this cycle, no need to take another
    //     const _snapshot = snapshotManager.takeSnapshot(target, updateCycleCount, clone)
    //     snapshotMap.set(reactive, _snapshot) // snapshots are shallow clones!
    //     return _snapshot;
    // }

    // getSnapshot(reactive: ReactiveModel) {
    //     const snapshotMap = this.snapshotMap;
    //     if (!snapshotMap) return null;
    //     const snapshot = snapshotMap.get(reactive)
    //     if (!snapshot) return null;
    //     return snapshot
    // }

    opsMap: WeakMap<MetaReactiveModel, MutationRecord[]> = new WeakMap();

    composeOps(target: ReactiveModel, ops: MutationRecord[]) {
        const meta = getMetaReactive(target)
        let existingOps = this.opsMap.get(meta);
        if (existingOps) {
            existingOps.push(...ops)
        }
        else {
            this.opsMap.set(meta, ops);
        }
    }

    recordOp(target: ReactiveModel, op: MutationRecord) { //FIX:
        const meta = getMetaReactive(target)
        // TODO: consolidate set ops (cannot consolidate mutation ops, those need to be in order)
        let existingOps = this.opsMap.get(meta);
        if (existingOps) {
            existingOps.push(op)
        }
        else {
            this.opsMap.set(meta, [op]);
        }
    }

    getOps(target: ReactiveModel) {
        const meta = getMetaReactive(target)
        return this.opsMap.get(meta)
    }


    // EFFECTS

    effects: SetMap<Phase, Effect> = new SetMap();
    reactiveEffects: SetMap<Phase, Effect> = new SetMap();

    scheduleEffect(target: Watchable, effect: Effect, phase: Phase) {
        if (target === unwrap(effect)) {
            this.reactiveEffects.addToSet(effect, phase)
        }
        else {
            this.effects.addToSet(effect, phase)
        }
    }

    runEffects(phase: Phase) {
        const effects = this.effects.get(phase);
        if (effects) {
            for (const effect of effects) {
                // runEffect(effect)
                effect()
            }
        }
        const reactiveEffects = this.reactiveEffects.get(phase)
        if (reactiveEffects) {
            for (const effect of reactiveEffects) {
                // runEffect(effect);
                effect()
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
        const tasks = currentUpdateCycle?.tasks;
        if (!tasks) return;
        const _tasks = tasks[hookName]
        for (const task of _tasks) {
            task();
        }
    }
}

// function getCurrentValue(target: ReactiveTarget) {
//     if (target instanceof Function) {
//         return target()
//     }
//     else if (isReactiveModel(target)) {
//         return target;
//     }
// }



export enum Hooks {
    AFTER_PRERENDER_PHASE = "oppc",
    BEFORE_RENDER = "br",
    ON_RENDERED = "or",
    ON_UPDATE_COMPLETED = "uc"
}


// const updateCompletedTasks: (() => void)[] = [];


function createUpdateCycleHook(hookName: Hooks) {
    return (task: () => void, options?: { cancel?: ScheduleCancel; __devName?: string }) => {
        const _options = <SchedulerOptions>options || { flask: '' }
        _options.flask = 'outlive'
        return $schedule(task, _options, {
            enroll(task) {
                const tasks = currentUpdateCycle?.tasks;
                if (!tasks) throw new Error('No update cycle :(. This should never happen')
                tasks[hookName].add(task)
            },
            remove(task) {
                const tasks = currentUpdateCycle?.tasks;
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


// export function runPrerenderEffectsAndTasks() {
//     const updateCycle = getCurrentUpdateCycle()
//     if (updateCycle) {
//         updateCycle.runEffects('pre');
//         updateCycle.runTasks(Hooks.AFTER_PRERENDER_PHASE)
//     }
// }

function beforeRepaint(cb: () => void) {
    const id = requestAnimationFrame(cb)
    return {
        cancel: () => cancelAnimationFrame(id)
    }
}

function queueTask(cb: () => void) {
    const id = setImmediate(cb)
    return {
        cancel() {
            clearImmediate(id)
        }
    }
}