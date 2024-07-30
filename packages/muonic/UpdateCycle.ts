import { AnyObject } from "@rue/types";
import { SnapshotManager } from "./SnapshotManager";
import { ReactiveObject } from "./useReactivize";
import { Signal } from "./useSignalize";
import { getTaskQueueForProp, runNonSyncTasks } from "./watch";
import { $listen, ScheduleStop } from "@rue/flask";
import { removeItem } from "../utils/array";
import { beforeRepaint, queueTask } from "@rue/thread";

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
    triggeredReactives: Map<ReactiveObject, Map<string, [any, any]>> | undefined;
    snapshotMap: Map<ReactiveObject, AnyObject> | undefined;
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

    flagReactive(target: ReactiveObject, key: string, newValue: any, oldValue: any) {
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

        // only need to store key and values if taskqueues exist
        let taskQueue = getTaskQueueForProp(target, key, 'pre');
        if (taskQueue) {
            props.set(key, [newValue, oldValue]);
            return;
        }
        taskQueue = getTaskQueueForProp(target, key, 'render');
        if (taskQueue) {
            props.set(key, [newValue, oldValue]);
            return;
        }
        taskQueue = getTaskQueueForProp(target, key, 'post');
        if (taskQueue) {
            props.set(key, [newValue, oldValue]);
            return;
        }
    }

    takeSnapshot(reactive: ReactiveObject) {
        let snapshotMap = this.snapshotMap;
        if (!snapshotMap) {
            snapshotMap = new Map();
            this.snapshotMap = snapshotMap;
        }
        if (snapshotMap.has(reactive)) return; // snapshot of original state already taken for this cycle, no need to take another
        snapshotMap.set(reactive, snapshotManager.takeSnapshot(reactive, updateCycleCount)) // snapshots are shallow clones!
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


