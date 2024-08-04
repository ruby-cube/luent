import { AnyObject } from "@rue/types";
import { SnapshotManager } from "./SnapshotManager";
import { ReactiveModel } from "./useReactiveModels";
import { Signal } from "./useSignals";
import { getTaskQueueForProp, runNonSyncTasks } from "./watch";
import { $listen, ScheduleStop } from "@rue/flask";
import { removeItem } from "../utils/array";
import { beforeRepaint, queueTask } from "@rue/thread";
import { MutationOp, SetOp } from "./deepWatch";
import { asReactiveProp, ReactiveProp } from "./ReactiveProp";
import { DerivedSignal } from "./DerivedSignal";

export type Phase = 'pre' | 'render' | 'post' | 'sync'

const snapshotManager = new SnapshotManager();

let updateCycleCount = -1;

let currentUpdateCycle: UpdateCycle | undefined;

export function getCurrentUpdateCycle() {
    return currentUpdateCycle;
}

export function setCurrentUpdateCycle(updateCycle: UpdateCycle) {
    return currentUpdateCycle = updateCycle;
}

export function endUpdateCycle() {
    currentUpdateCycle = undefined;
}

export class UpdateCycle {
    triggeredSignals: Map<Signal, [any, any]> | undefined;
    triggeredReactives: Map<ReactiveModel, Map<PropertyKey, [any, any]>> | undefined;
    snapshotMap: Map<ReactiveModel, AnyObject> | undefined;
    completedTasks: Set<Function> = new Set();

    constructor() {
        updateCycleCount++;
        currentUpdateCycle = this;
        beforeRepaint(() => {
            _runTasks(Hooks.BEFORE_RENDER)
            runNonSyncTasks('render');
            _runTasks(Hooks.ON_RENDERED)
            queueTask(() => {
                runNonSyncTasks('post');
                _runTasks(Hooks.ON_UPDATE_COMPLETED)
                endUpdateCycle();
            })
        })
    }

    flagSignal(signal: Signal, newValue: any, oldValue: any) {
        let signals = this.triggeredSignals
        if (!signals) {
            signals = new Map();
            this.triggeredSignals = signals
        }
        signals.set(signal, [newValue, oldValue]);
    }

    flagReactive(target: ReactiveModel, key: PropertyKey, newValue: any, oldValue: any) {
        let targetMap = this.triggeredReactives
        if (!targetMap) {
            targetMap = new Map();
            this.triggeredReactives = targetMap
        }

        let props = targetMap.get(target)
        if (!props) {
            props = new Map();
            targetMap.set(target, props);
        }

        const phases = ['pre', 'render', 'post'] as const
        for (const phase of phases) {
            let taskQueue = getTaskQueueForProp(asReactiveProp(target, key), phase);
            if (taskQueue) {
                props.set(key, [newValue, oldValue]);
                return; // return because we only need to store key and values if taskqueues exist
            }
        }
    }

    takeSnapshot(reactive: ReactiveModel, target: AnyObject) {
        let snapshotMap = this.snapshotMap;
        if (!snapshotMap) {
            snapshotMap = new Map();
            this.snapshotMap = snapshotMap;
        }
        if (snapshotMap.has(reactive)) return; // snapshot of original state already taken for this cycle, no need to take another
        const snapshot = snapshotManager.takeSnapshot(target, updateCycleCount)
        snapshotMap.set(reactive, snapshot) // snapshots are shallow clones!
        return snapshot;
    }

    getSnapshot(reactive: ReactiveModel) {
        const snapshotMap = this.snapshotMap;
        if (!snapshotMap) throw "no snapshot map :("
        const snapshot = snapshotMap.get(reactive)
        if (!snapshot) throw "no snapshot :("
        return snapshot
    }

    opsMap: WeakMap<ReactiveModel, (MutationOp | SetOp)[]> = new WeakMap();

    composeOps(target: ReactiveModel, ops: (MutationOp | SetOp)[]) {
        let existingOps = this.opsMap.get(target);
        if (existingOps) {
            existingOps.push(...ops)
        }
        else {
            this.opsMap.set(target, ops);
        }
    }

    recordOp(target: ReactiveModel, op: MutationOp | SetOp) {

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


    tasks: {
        [Hooks.BEFORE_RENDER]: Set<Function>,
        [Hooks.ON_RENDERED]: Set<Function>,
        [Hooks.ON_PRE_PHASE_COMPLETED]: Set<Function>,
        [Hooks.ON_UPDATE_COMPLETED]: Set<Function>,
    } = {
            [Hooks.BEFORE_RENDER]: new Set(),
            [Hooks.ON_RENDERED]: new Set(),
            [Hooks.ON_PRE_PHASE_COMPLETED]: new Set(),
            [Hooks.ON_UPDATE_COMPLETED]: new Set(),
        }


    initialValueMap: Map<Signal | ReactiveProp | DerivedSignal, any> = new Map();
    getInitialValue(reactiveRef: Signal | ReactiveProp | DerivedSignal) {
        if (!this.initialValueMap.has(reactiveRef)) return this.NULL;
        return this.initialValueMap.get(reactiveRef);
    }
    storeInitialValue(reactiveRef: Signal | ReactiveProp | DerivedSignal, value: any) {
        this.initialValueMap.set(reactiveRef, value);
    }
    NULL = Symbol();


    mustRetrack: Set<DerivedSignal> = new Set();
    retracked: Set<DerivedSignal> = new Set();
}



// derived signals
// track when you first call it
// retrack whenever you call it and it has changed




export enum Hooks {
    ON_PRE_PHASE_COMPLETED = "oppc",
    BEFORE_RENDER = "br",
    ON_RENDERED = "or",
    ON_UPDATE_COMPLETED = "uc"
}


// const updateCompletedTasks: (() => void)[] = [];

export function _runTasks(hookName: Hooks) {
    const tasks = getCurrentUpdateCycle()?.tasks;
    if (!tasks) throw new Error('No update cycle :(. This should never happen')
    const _tasks = tasks[hookName]
    for (const task of _tasks) {
        task();
    }
}

function createUpdateCycleHook(hookName: Hooks) {
    return (task: () => void, options?: { once?: true, until?: ScheduleStop }) => {
        const tasks = getCurrentUpdateCycle()?.tasks;
        if (!tasks) throw new Error('No update cycle :(. This should never happen')
        return $listen(task, options || {}, {
            enroll(task) {
                tasks[hookName].add(task)
            },
            remove(task) {
                tasks[hookName].delete(task)
            }
        })
    }
}

export const onRendered = createUpdateCycleHook(Hooks.ON_RENDERED)
export const beforeRender = createUpdateCycleHook(Hooks.BEFORE_RENDER)
export const onPreRenderCompleted = createUpdateCycleHook(Hooks.ON_PRE_PHASE_COMPLETED)
export const onUpdateCompleted = createUpdateCycleHook(Hooks.ON_PRE_PHASE_COMPLETED)

export function onPhaseCompleted(phase: Phase, handler: () => void) {
    if (phase === 'pre') {
        onPreRenderCompleted(handler)
    }
    else if (phase === 'render') {
        onRendered(handler)
    }
    else if (phase === 'post') {
        onUpdateCompleted(handler)

    }
    else if (phase === 'sync') {
        throw new Error('This has not been implemented yet')
    }
}
