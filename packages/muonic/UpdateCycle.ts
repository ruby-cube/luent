import { AnyObject } from "@rue/types";
import { SnapshotManager } from "./SnapshotManager";
import { isReactiveModel, ReactiveModel } from "./Reactive$";
import { isSignal, Signal } from "./$Signal";
import { runNonSyncTasks } from "./watch";
import { $listen, ScheduleStop } from "@rue/flask";
import { removeItem } from "../utils/array";
import { beforeRepaint, queueTask } from "@rue/thread";
import { MutationRecord, SetOp } from "./deepWatch";
import { asReactiveProp, getReactiveProp, isReactiveProp, ReactiveProp } from "./ReactiveProp";
import { DerivedSignal, isDerivedSignal } from "./DerivedSignal";
import { UNDEFINED } from "@rue/utils";
import { ReactiveAtom } from "./DependencyTracker";

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
    triggeredReactiveAtom: Map<ReactiveAtom, [any, any]> | undefined;
    triggeredReactives: Map<ReactiveModel, [ReactiveModel, AnyObject]> | undefined; // snapshot

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

    flagReactiveAtom(target: ReactiveAtom, newValue: any, oldValue: any) {
        let atomMap = this.triggeredReactiveAtom
        if (!atomMap) {
            atomMap = new Map();
            this.triggeredReactiveAtom = atomMap
        }
        const values = atomMap.get(target);
        if (values) values[0] = newValue;  // preserves initial old value at start of cycle
        else atomMap.set(target, [newValue, oldValue]);
    }

    flagReactive(target: ReactiveModel, snapshot: AnyObject) {
        let reactivesMap = this.triggeredReactives
        if (!reactivesMap) {
            reactivesMap = new Map();
            this.triggeredReactives = reactivesMap
        }

        const values = reactivesMap.get(target)
        if (!values) reactivesMap.set(target, [target, snapshot])

        // const phases = ['pre', 'render', 'post'] as const
        // for (const phase of phases) {
        //     const reactiveProp = getReactiveProp(target, key)
        //     if (!reactiveProp) return;
        //     let taskQueue = getTaskQueueForProp(reactiveProp, phase);
        //     if (taskQueue) {
        //         const values = props.get(key);
        //         if (values) values[0] = newValue // preserves initial old value at start of cycle
        //         else props.set(key, [newValue, oldValue]);
        //         return; // return because we only need to store key and values if *any* taskqueue exists (in case flagReactive is just for watching a whole reactiveModel)
        //     }
        // }
    }

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


    derivedSignalMap: Map<DerivedSignal, any> = new Map();

    storeInitialValue(derivedSignal: DerivedSignal, value: any) {
        this.derivedSignalMap.set(derivedSignal, value);
    }

    getInitialValue(target: ReactiveAtom | DerivedSignal | ReactiveModel) {
        if (isReactiveModel(target)) {
            if (!this.triggeredReactives?.has(target)) return UNDEFINED;
            return this.triggeredReactives.get(target)![1]
        }
        else if (isDerivedSignal(target)) {
            if (!this.derivedSignalMap.has(target)) return UNDEFINED;
            return this.derivedSignalMap.get(target);
        }
        else {
            if (!this.triggeredReactiveAtom?.has(target)) return UNDEFINED;
            return this.triggeredReactiveAtom.get(target)![1]
        }
    }


    mustRetrack: Set<DerivedSignal> = new Set();
    retracked: Set<DerivedSignal> = new Set();
}



// derived signals
// track when you first call it
// retrack whenever you call it and it has changed




export enum Hooks {
    AFTER_PRERENDER_PHASE = "oppc",
    BEFORE_RENDER = "br",
    ON_RENDERED = "or",
    ON_UPDATE_COMPLETED = "uc"
}


// const updateCompletedTasks: (() => void)[] = [];

export function _runTasks(hookName: Hooks) {
    const tasks = getCurrentUpdateCycle()?.tasks;
    if (!tasks) return;
    const _tasks = tasks[hookName]
    for (const task of _tasks) {
        task();
    }
}

function createUpdateCycleHook(hookName: Hooks) {
    return (task: () => void, options?: { once?: true, until?: ScheduleStop }) => {
        return $listen(task, options || {}, {
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
