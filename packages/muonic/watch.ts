import { $listen, ListenerOptions, PendingOp, ScheduleStop } from "@rue/flask";
import { isSignal, Signal } from "./useSignalize";
import { ReactiveObject } from "./useReactivize";
import { AnyObject } from "@rue/types";
import { ActiveListener } from "../flask/ActiveListener";
import { getCurrentUpdateCycle, setCurrentUpdateCycle, UpdateCycle } from "./UpdateCycle";
import { DependencyTracker, getDependencyTracker, ReactiveProp } from "./DependencyTracker";
import { DERIVED_SIGNAL, DerivedSignal, isDerivedSignal, ReactiveSignal } from "./useDerivedSignal";
import { isEqual } from "@rue/utils";

//QUESTION: How useful is watching deep?

type WatchOptions = {
    deep?: boolean;
} & EffectOptions

type _WatchOptions = {
    deep?: boolean;
} & _EffectOptions

type EffectOptions = {
    phase?: 'pre' | 'post' | 'sync';
} & ListenerOptions

type _EffectOptions = {
    phase?: Phase;
} & ListenerOptions

type Phase = 'pre' | 'update' | 'post' | 'sync'


type ChangeHandler = (newValue: any, oldValue: any) => void
type ReactiveEffect = () => void //TODO: onCleanup function?
type Effect = ChangeHandler | ReactiveEffect



function isReactiveEffect(task: Function): task is ReactiveEffect {
    return reactiveEffects.has(task)
}




export function watch<T>(target: ReactiveSignal<T> | ReactiveObject<T extends AnyObject ? T : never>, handler: (newValue: T, oldValue: T) => void, options?: WatchOptions) {
    return _initializeEffect(handler, target, options);
}

export function initializeEffect(effect: () => void, options?: EffectOptions) { //NOTE: an effect is essentially a derived signal and effect combined into one function
    return _initializeEffect(effect, undefined, options);
}

// export function initializeUpdate(effect: () => void) {
//     return _initializeEffect(effect, undefined, { phase: 'update' });
// }

// export function watchForUpdate<T>(target: Signal<T> | (() => T) | ReactiveObject<T extends AnyObject ? T : never>, handler: (newValue: T, oldValue: T) => void, component: InternalComponent) {
//     return _initializeEffect(handler, target, { phase: 'update' });
// }

const derivedSignalMap: WeakMap<Function, DerivedSignal> = new WeakMap();
const reactiveEffects: WeakSet<Function> = new WeakSet();


export function _initializeEffect<T>(handler: ReactiveEffect, target: undefined, options?: _WatchOptions): ActiveListener
export function _initializeEffect<T>(handler: ChangeHandler, target?: ReactiveSignal<T> | ReactiveObject<T extends AnyObject ? T : never>, options?: _WatchOptions): ActiveListener
export function _initializeEffect<T>(handler: ChangeHandler | ReactiveEffect, target?: ReactiveSignal<T> | ReactiveObject<T extends AnyObject ? T : never>, options?: _WatchOptions): ActiveListener {
    const { phase, deep } = options ?? {};
    let taskQueues: Set<Effect>[];
    const isReactiveEffect = target === undefined;

    // collect tracked refs and get taskQueues
    if (target instanceof Function || isReactiveEffect) {
        const dependencies = getDependencies(target || handler, isReactiveEffect) //TODO: must retrack dependencies onChange like with derivedSignal to catch conditional dependencies? .. should the logic live here instead of in $()?
        taskQueues = useTaskQueues(dependencies, phase, deep);
    }
    else {
        // watch all properties of reactive
        taskQueues = useTaskQueuesForReactive(target, phase, deep)
    }

    // set up listeners
    const activeListeners: (ActiveListener | PendingOp)[] = [];

    for (const taskQueue of taskQueues) {
        const activeListener = $listen(handler, options!, {
            enroll(task) {
                if (target && isDerivedSignal(target)) {
                    derivedSignalMap.set(task, target)
                }
                else if (isReactiveEffect) {
                    reactiveEffects.add(task)
                }
                taskQueue.add(task)
            },
            remove(task) {
                taskQueue.delete(task)
            }
        });
        activeListeners.push(activeListener);
    }

    return {
        stop() {
            for (const activeListener of activeListeners) {
                if ('stop' in activeListener) activeListener.stop();
                else activeListener.cancel();
            }
        }
    }
}


export function getDependencies(reactiveFunction: Function, isReactiveEffect?: boolean) {
    if (isSignal(reactiveFunction)) return [reactiveFunction];
    const tracker = new DependencyTracker();
    if (isReactiveEffect) {
        const [deps] = tracker.callToCollectDependencies(reactiveFunction) //TODO: pass in cleanup function?
        return deps;
    }
    if (isDerivedSignal(reactiveFunction)) {
        const derivedSignal = reactiveFunction[DERIVED_SIGNAL];
        const deps = derivedSignal.dependencies;
        if (deps.length > 0) return deps;
        reactiveFunction(); // allow derived signal's internal tracking to collect dependencies
        return derivedSignal.dependencies;
    }
    const [deps] = tracker.callToCollectDependencies(reactiveFunction)
    return deps;
}




export function track(value: any, target: Signal): void
export function track(value: any, target: ReactiveObject, key: string | symbol): void
export function track(value: any, target: Signal | ReactiveObject, key?: string | symbol) {
    const tracker = getDependencyTracker();
    if (!tracker) return;
    if (tracker.shouldTrack) {
        if (isSignal(target)) {
            tracker.addSignal(target);
        }
        else {
            if (!key) throw "Cannot track undefined key"
            tracker.addProp(target, key);
        }
    }
}

type SignalToDerivedMap = WeakMap<Signal, WeakSet<() => any>> //QUESTION: not sure if weak set will work, or if I need to subscribe and unsubscribe

class DerivedSignalTasks {
    constructor(
        public value: any,
        public deps: (Signal | ReactiveProp)[] = [],
        public pre?: Set<Effect> | undefined,
        public post?: Set<Effect> | undefined,
    ) { }
}

class EffectRecord {
    constructor(
        public deps: (Signal | ReactiveProp)[] = [],
        public phase: 'pre' | 'post',
        public effect: Effect,
    ) { }
}

const signalTaskQueues: WeakMap<Signal, Map<Phase, Set<Effect>>> = new WeakMap();
const reactivePropsTaskQueues: WeakMap<ReactiveObject, Map<string, Map<Phase, Set<Effect>>>> = new WeakMap();
const reactiveObjTaskQueues: WeakMap<ReactiveObject, Map<'pre' | 'post', Set<Effect>>> = new WeakMap();

export function useTaskQueues(deps: (Signal | ReactiveProp)[], phase: Phase = 'pre', deep: boolean = false) {
    const taskQueues: Set<Effect>[] = [];
    for (const dep of deps) {
        if (isSignal(dep)) {
            const flushMap = signalTaskQueues.get(dep) || new Map();
            const taskQueue = flushMap.get(phase) || new Set()
            flushMap.set(phase, taskQueue);
            signalTaskQueues.set(dep, flushMap);
            taskQueues.push(taskQueue);
        }
        else {
            const [reactiveObj, key] = dep;
            const propMap = reactivePropsTaskQueues.get(reactiveObj) || new Map();
            const flushMap = propMap.get(key) || new Map();
            const taskQueue = flushMap.get(phase) || new Set()
            flushMap.set(phase, taskQueue);
            propMap.set(key, flushMap)
            reactivePropsTaskQueues.set(reactiveObj, propMap);
            taskQueues.push(taskQueue);
        }
    }
    return taskQueues;
}

function useTaskQueuesForReactive(reactive: ReactiveObject, phase: Phase = 'pre', deep: boolean = false) {
    const taskQueues: Set<Effect>[] = [];
    if (phase === 'sync') throw "Reactive effect cannot run synchronously on property change when watching reactive objects. Did you mean to watch a reactive property?"
    const flushMap = reactiveObjTaskQueues.get(reactive) || new Map();
    const taskQueue = flushMap.get(phase) || new Set()
    flushMap.set(phase, taskQueue);
    reactiveObjTaskQueues.set(reactive, flushMap);
    taskQueues.push(taskQueue);
    return taskQueues;
}

function getTaskQueueForReactive(reactive: ReactiveObject, phase: 'pre' | 'post') {
    return reactiveObjTaskQueues.get(reactive)?.get(phase);
}

function getTaskQueueForSignal(signal: Signal, phase: 'pre' | 'post' | 'update') {
    return signalTaskQueues.get(signal)?.get(phase);
}

export function getTaskQueueForProp(target: ReactiveObject, key: string, phase: 'pre' | 'post' | 'update') {
    return reactivePropsTaskQueues.get(target)?.get(key)?.get(phase)
}





export function trigger(target: Signal | ReactiveObject, newValue: any, oldValue: any, key?: string) {
    if (newValue === oldValue) return;
    let currentUpdateCycle = getCurrentUpdateCycle()
    if (!currentUpdateCycle) {
        currentUpdateCycle = new UpdateCycle();
        setCurrentUpdateCycle(currentUpdateCycle)
    }

    // run sync tasks
    const tracker = getDependencyTracker();
    tracker?.stop(); // in case reactive refs are set during an effect
    runSyncTasks(target, newValue, oldValue, key);
    tracker?.restore();

    // collect triggered refs for this cycle for 'pre', 'update', and 'post' phases
    if (isSignal(target)) currentUpdateCycle.flagSignal(target, newValue, oldValue)
    else currentUpdateCycle.flagReactive(target, key!, newValue, oldValue)

    // take snapshot clone if watching reactive object, this will be the old value
    if (reactiveObjTaskQueues.has(target)) {
        currentUpdateCycle.takeSnapshot(target);
    }
}

function runSyncTasks(target: Signal | ReactiveObject, newValue: any, oldValue: any, key?: string) {
    const updateCycle = getCurrentUpdateCycle();
    if (!updateCycle) throw new Error("No update cycle :(")
    const completedTasks = updateCycle.completedTasks;
    if (isSignal(target)) {
        const taskQueue = signalTaskQueues.get(target)?.get('sync')
        if (taskQueue) {
            runNonRepeatingTasks(taskQueue, newValue, oldValue, completedTasks)
        }
    }
    else {
        if (!key) throw new Error("Cannot track undefined key")
        const taskQueue = reactivePropsTaskQueues.get(target)?.get(key)?.get('sync');
        if (taskQueue) {
            runNonRepeatingTasks(taskQueue, newValue, oldValue, completedTasks)
        }
    }
}


function runNonRepeatingTasks(taskQueue: Set<Effect>, newValue: any, oldValue: any, completedTasks: Set<Function>) {
    for (const task of taskQueue) {
        if (completedTasks.has(task)) continue;
        if (derivedSignalMap.has(task)) {
            const derivedSignal = derivedSignalMap.get(task);
            if (!derivedSignal) throw new Error("derived signal not found")
            const _derivedSignal = derivedSignal[DERIVED_SIGNAL]
            const oldValue = _derivedSignal.value;
            const newValue = derivedSignal();
            if (!isEqual(newValue, oldValue)) {
                task(newValue, oldValue);
            }
        }
        else if (isReactiveEffect(task)) {
            task() //TODO: pass in clean up function?
        }
        else {
            task(newValue, oldValue)
        }
        completedTasks.add(task)
    }
}




export function runNonSyncTasks(phase: "pre" | "post" | "update") {
    const updateCycle = getCurrentUpdateCycle();
    if (!updateCycle) throw "No current update cycle :("
    const completedTasks = updateCycle.completedTasks;
    const triggeredReactives = updateCycle.triggeredReactives;
    if (triggeredReactives) {
        for (const [reactive, keys] of triggeredReactives) {
            if (phase !== 'update') {
                const taskQueue = getTaskQueueForReactive(reactive, phase);
                if (taskQueue) {
                    for (const task of taskQueue) {
                        const snapshotMap = updateCycle.snapshotMap;
                        if (!snapshotMap) throw "no snapshot map :("
                        // TODO: compare snapshot to current object .. are they equal? if so, don't run tasks and get rid of snapshot ... should the diff be deep?
                        task(reactive, snapshotMap.get(reactive))
                    }
                }
            }

            for (const [key, [newValue, oldValue]] of keys) {
                const taskQueue = getTaskQueueForProp(reactive, key, phase);
                if (taskQueue) {
                    runNonRepeatingTasks(taskQueue, newValue, oldValue, completedTasks)
                }
            }
        }
    }
    
    const triggeredSignals = updateCycle.triggeredSignals;
    if (triggeredSignals) {
        for (const [signal, [newValue, oldValue]] of triggeredSignals) {
            const taskQueue = getTaskQueueForSignal(signal, phase);
            if (taskQueue) {
                runNonRepeatingTasks(taskQueue, newValue, oldValue, completedTasks)
            }
        }
    }
}
