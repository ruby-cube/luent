import { AnyObject } from "@rue/types";
import { SnapshotManager } from "./SnapshotManager";
import { ReactiveModel } from "./useReactiveModels";
import { Signal } from "./useSignals";
import { getTaskQueueForProp, runNonSyncTasks } from "./watch";
import { $listen, ScheduleStop } from "@rue/flask";
import { removeItem } from "../utils/array";
import { beforeRepaint, queueTask } from "@rue/thread";
import { MutationOp, SetOp } from "./deepWatch";
import { asReactiveProp } from "./ReactiveProp";

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
            _runTasks(Hooks.BEFORE_UPDATE)
            runNonSyncTasks('render');
            _runTasks(Hooks.UPDATE_COMPLETED)
            queueTask(() => {
                runNonSyncTasks('post');
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
}







export enum Hooks {
    UPDATE_COMPLETED = "uc",
    BEFORE_UPDATE = "bc",
}

const tasks: { [K in Hooks]: Set<() => void> } = {
    [Hooks.BEFORE_UPDATE]: new Set(),
    [Hooks.UPDATE_COMPLETED]: new Set(),
}

const updateCompletedTasks: (() => void)[] = [];

export function _runTasks(hookName: Hooks) {
    const _tasks = tasks[hookName]
    for (const task of _tasks) {
        task();
    }
}

export function onUpdateComplete(task: () => void, options?: { once?: true, until?: ScheduleStop }) {
    return $listen(task, options || {}, {
        enroll(task) {
            updateCompletedTasks.push(task)
        },
        remove(task) {
            removeItem(task, updateCompletedTasks)
        }
    })
}

export function beforeUpdatePhase(task: () => void, options?: { once?: true, until?: ScheduleStop }) {
    return $listen(task, options || {}, {
        enroll(task) {
            updateCompletedTasks.push(task)
        },
        remove(task) {
            removeItem(task, updateCompletedTasks)
        }
    })
}


