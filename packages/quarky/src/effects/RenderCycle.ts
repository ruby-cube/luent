import { setImmediate, clearImmediate } from "@rue/thread";
import { $schedule, ScheduleCancel, SchedulerOptions, unwrap } from "@rue/flask";
import { SetMap } from "@rue/utils";
import { MutationRecord } from "./deepWatch";
import { getMetaReactive, IonicModel } from "../ionize/IonicModel";
import { MetaIonicModel } from "../ionize/MetaIonicModel";
// import { runEffect } from "./watch";

export type Watchable = any
// AtomicIon | DerivedIon | IonicEffect  | IonicModel | ObservedProp
export type Task = (...args: any[]) => void;

// export type Phase = Phase.BEFORE_RENDER | Phase.RENDER | Phase.AFTER_RENDER | Phase.SYNC

export enum Phase {
    SYNC = 1,
    BEFORE_RENDER,
    RENDER,
    AFTER_RENDER,
    CYCLE_COMPLETE,
}

// const COMPLETE: 4 = Phase.AFTER_RENDER + 1 as 4

let renderCycleCount = -1;

let currentRenderCycle: RenderCycle | undefined;
// let flushingRenderCycle: RenderCycle | undefined;

// function startFlushPhase(phase: Phase, renderCycle: RenderCycle) {
//     renderCycle.setPhase(phase);
//     // flushingRenderCycle = renderCycle
// }

// function endFlushPhase(renderCycle: RenderCycle) {
//     renderCycle.endPhase()
//     // flushingRenderCycle = undefined
// }

export function getCurrentRenderCycle() {
    return currentRenderCycle;
}

export function useRenderCycle() {
    let renderCycle = currentRenderCycle
    if (!renderCycle) {
        renderCycle = new RenderCycle();

    }
    return renderCycle;
}

// export function getFlushingRenderCycle() {
//     return flushingRenderCycle;
// }



function startCollectingEffects(renderCycle: RenderCycle) {
    if (currentRenderCycle)
        throw new Error("Overlapping update cycles! Need to either implement a different type of update cycle management system or set up guards to prevent overlaps")
    return currentRenderCycle = renderCycle;
}

function endCollectingEffects() {
    currentRenderCycle = undefined;
}

export class RenderCycle {

    completedPhase: Phase | 0 = 0
    setCompletedPhase(phase: Phase) {
        this.completedPhase = phase
    }

    phase: Phase = Phase.SYNC
    setPhase(phase: Phase) {
        this.phase = phase
    }

    constructor() {
        renderCycleCount++;
        startCollectingEffects(this)
        queueTask(() => { //QUESTION: Should I wrap in a flask??
            this.setPhase(Phase.BEFORE_RENDER)
            this.runTasks(Phase.BEFORE_RENDER);
            this.setCompletedPhase(Phase.BEFORE_RENDER)
            beforeRepaint(() => {
                queueTask(() => { // queue this BEFORE running render so that it will run as soon after render as possible
                    this.setPhase(Phase.AFTER_RENDER)
                    this.runTasks(Phase.AFTER_RENDER);
                    this.setCompletedPhase(Phase.AFTER_RENDER)
                    this.runTasks(Phase.CYCLE_COMPLETE)
                    this.setCompletedPhase(Phase.CYCLE_COMPLETE)
                    endCollectingEffects(); // Any set ops after this point will be scheduled for the NEXT render cycle
                })
                this.setPhase(Phase.RENDER)
                this.runTasks(Phase.RENDER);
                this.setCompletedPhase(Phase.RENDER)
            })
        })
    }

    get count() {
        return renderCycleCount;
    }

    // snapshotMap: Map<IonicModel, AnyObject> | undefined;

    // takeSnapshot(reactive: IonicModel, target: AnyObject, clone?: AnyObject) {
    //     let snapshotMap = this.snapshotMap;
    //     if (!snapshotMap) {
    //         snapshotMap = new Map();
    //         this.snapshotMap = snapshotMap;
    //     }
    //     if (snapshotMap.has(reactive))
    //         return snapshotMap.get(reactive)!; // snapshot of original state already taken for this cycle, no need to take another
    //     const _snapshot = snapshotManager.takeSnapshot(target, renderCycleCount, clone)
    //     snapshotMap.set(reactive, _snapshot) // snapshots are shallow clones!
    //     return _snapshot;
    // }

    // getSnapshot(reactive: IonicModel) {
    //     const snapshotMap = this.snapshotMap;
    //     if (!snapshotMap) return null;
    //     const snapshot = snapshotMap.get(reactive)
    //     if (!snapshot) return null;
    //     return snapshot
    // }

    opsMap: WeakMap<MetaIonicModel, MutationRecord[]> = new WeakMap();

    // composeOps(target: IonicModel, ops: MutationRecord[]) {
    //     const meta = getMetaReactive(target)
    //     let existingOps = this.opsMap.get(meta);
    //     if (existingOps) {
    //         existingOps.push(...ops)
    //     }
    //     else {
    //         this.opsMap.set(meta, ops);
    //     }
    // }

    recordOp(target: IonicModel, op: MutationRecord) {
        const meta = getMetaReactive(target)
        let existingOps = this.opsMap.get(meta);
        if (existingOps) {
            existingOps.push(op)
        }
        else {
            this.opsMap.set(meta, [op]);
        }
    }

    getOps(target: IonicModel) {
        const meta = getMetaReactive(target)
        return this.opsMap.get(meta)
    }


    // EFFECTS

    tasks: SetMap<Phase, Task> = new SetMap();
    // reactiveEffects: SetMap<Phase, Task> = new SetMap();

    scheduleTask(task: Task, phase: Exclude<Phase, Phase.SYNC>) {
        if (phase <= this.completedPhase) {
            if (__DEV__) console.warn(`CASE RESEARCH: Effect was triggered after render cycle phase ${phase}. Task will not run. Potentially implement a way to schedule for next cycle instead if needed?`)
            return;
        }
        // if (target === unwrap(effect)) {
        //     this.reactiveEffects.addToSet(effect, phase)
        // }
        // else {
        this.tasks.addToSet(task, phase)
        // }
    }

    runTasks(phase: Phase) {
        const tasks = this.tasks.get(phase);
        if (tasks) {
            for (const task of tasks) {
                // runEffect(effect)
                task()
            }
        }
        // const reactiveEffects = this.reactiveEffects.get(phase)
        // if (reactiveEffects) {
        //     for (const effect of reactiveEffects) {
        //         // runEffect(effect);
        //         effect()
        //     }
        // }
    }

    // TASKS

    // tasks: {
    //     [Hooks.BEFORE_RENDER]: Set<Function>,
    //     [Hooks.ON_RENDERED]: Set<Function>,
    //     [Hooks.ON_RENDER_CYCLE_COMPLETE]: Set<Function>,
    // } = {
    //         [Hooks.BEFORE_RENDER]: new Set(),
    //         [Hooks.ON_RENDERED]: new Set(),
    //         [Hooks.ON_RENDER_CYCLE_COMPLETE]: new Set(),
    //     }


    // runTasks(hookName: Hooks) {
    //     const tasks = currentRenderCycle?.tasks;
    //     if (!tasks) return;
    //     const _tasks = tasks[hookName]
    //     for (const task of _tasks) {
    //         task();
    //     }
    // }
}

// function getCurrentValue(target: ReactiveTarget) {
//     if (target instanceof Function) {
//         return target()
//     }
//     else if (isIonicModel(target)) {
//         return target;
//     }
// }



// export enum Hooks {
//     BEFORE_RENDER = "br",
//     ON_RENDERED = "or",
//     ON_RENDER_CYCLE_COMPLETE = "uc"
// }


// const updateCompletedTasks: (() => void)[] = [];


function createRenderCycleHook(phase: Phase) {
    return (task: () => void, options?: { cancel?: ScheduleCancel; __devName?: string }) => {
        const _options = <SchedulerOptions>options || { flask: '' }
        _options.flask = 'outlive'
        return $schedule(task, _options, {
            enroll(task) {
                const tasks = useRenderCycle().tasks;
                tasks.get(phase)?.add(task)
            },
            remove(task) {
                const tasks = currentRenderCycle?.tasks;
                tasks?.get(phase)?.delete(task)
            }
        })
    }
}

export const beforeRender = createRenderCycleHook(Phase.BEFORE_RENDER)
export const onRender = createRenderCycleHook(Phase.RENDER)
export const onRendered = createRenderCycleHook(Phase.AFTER_RENDER)
export const onRenderCycleComplete = createRenderCycleHook(Phase.CYCLE_COMPLETE)


// export function onPhaseCompleted(phase: Phase, handler: () => void) {
//     if (phase === Phase.BEFORE_RENDER) {
//         afterPrerenderPhase(handler)
//     }
//     else if (phase === Phase.RENDER) {
//         onRendered(handler)
//     }
//     else if (phase === Phase.AFTER_RENDER) {
//         onRenderCycleComplete(handler)

//     }
//     else if (phase === Phase.SYNC) {
//         throw new Error("This should never happen. There is no after sync phase hook")
//     }
// }


// export function runPrerenderEffectsAndTasks() {
//     const renderCycle = getCurrentRenderCycle()
//     if (renderCycle) {
//         renderCycle.runTasks(Phase.BEFORE_RENDER);
//         renderCycle.runTasks(Hooks.AFTER_PRERENDER_PHASE)
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