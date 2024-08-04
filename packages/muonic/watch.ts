import { $listen, ListenerOptions, PendingOp, ScheduleStop } from "@rue/flask";
import { isSignal, Signal } from "./useSignals";
import { isReactiveModel, isReactiveObject, ReactiveModel, toRaw } from "./useReactiveModels";
import { AnyObject } from "@rue/types";
import { ActiveListener } from "../flask/ActiveListener";
import { getCurrentUpdateCycle, setCurrentUpdateCycle, UpdateCycle } from "./UpdateCycle";
import { DependencyTracker, getDependencyTracker } from "./DependencyTracker";
import { DERIVED_SIGNAL, DerivedSignal, hasSignal, isDerivedSignal, ReactiveSignal } from "./DerivedSignal";
import { isEqual } from "@rue/utils";
import { deepWatch, MutationOp, SetOp } from "./deepWatch";
import { collectReactiveProps, registerDebuggers, runTrackDebugger, runTriggerDebugger, WatchDebugOptions } from "./debug";
import { asReactiveProp, isReactiveProp, ReactiveProp } from "./ReactiveProp";
import { trace } from "console";

//QUESTION: How useful is watching deep?

export type WatchOptions = {
    deep?: boolean;
    eager?: true;
} & EffectOptions

type EffectOptions = {
    phase?: Phase;
} & ListenerOptions & WatchDebugOptions

type Phase = 'pre' | 'render' | 'post' | 'sync'


type MutationHandler<T extends any[] | Map<any, any> | Set<any> = any[] | Map<any, any> | Set<any>> = (newValue: T, oldValue: T, ops?: MutationOp[]) => void
export type ChangeHandler<T = AnyObject> = T extends any[] | Map<any, any> | Set<any> ? MutationHandler<T> : (newValue: T, oldValue: T, ops?: (MutationOp | SetOp)[]) => void
type ReactiveEffect = () => void //TODO: onCleanup function?
type Effect = ChangeHandler | ReactiveEffect



function isReactiveEffect(task: Function): task is ReactiveEffect {
    return reactiveEffects.has(task)
}




export function watch<T>(target: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, handler: ChangeHandler<T>, options?: WatchOptions) {
    if (isReactiveObject(target)) {
        const watchers = deepWatch(target, [], options || {});
        function stop() {
            for (const watcher of watchers) {
                watcher.stop();
            }
        }
        return {
            stop
        }
    }
    return _initializeEffect(handler, target, options);
}

export function initializeEffect(effect: () => void, options?: EffectOptions) { //NOTE: an effect is essentially a derived signal and effect combined into one function
    return _initializeEffect(effect, undefined, options);
}

// export function initializeUpdate(effect: () => void) {
//     return _initializeEffect(effect, undefined, { phase: 'render' });
// }

// export function watchForRender<T>(target: Signal<T> | (() => T) | ReactiveModel<T extends AnyObject ? T : never>, handler: (newValue: T, oldValue: T) => void, component: InternalComponent) {
//     return _initializeEffect(handler, target, { phase: 'render' });
// }

const derivedSignalMap: WeakMap<Function, DerivedSignal> = new WeakMap();
const reactiveEffects: WeakSet<Function> = new WeakSet();


export function _initializeEffect<T>(handler: ReactiveEffect, target: undefined, options?: WatchOptions): ActiveListener
export function _initializeEffect<T>(handler: ChangeHandler<T>, target?: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, options?: WatchOptions): ActiveListener
export function _initializeEffect<T>(handler: ChangeHandler<T> | ReactiveEffect, target?: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, options?: WatchOptions): ActiveListener {
    const { phase, deep, eager } = options ?? {};



    let taskQueues: Set<Effect>[];
    const isReactiveEffect = target === undefined;

    // collect tracked refs and get taskQueues
    if (target instanceof Function || isReactiveEffect) {
        const dependencies = getDependencies(target || handler, isReactiveEffect) //TODO: must retrack dependencies onChange like with derivedSignal to catch conditional dependencies? .. should the logic live here instead of in $()?
        taskQueues = useTaskQueues(dependencies, phase);
        if (__DEV__) {
            registerDebuggers(dependencies, options)
        }
    }
    else {
        // watch all properties of reactive
        taskQueues = useTaskQueuesForReactive(target, phase)
        if (__DEV__) {
            if (isReactiveObject(target)) {
                const dependencies = collectReactiveProps(target);
                registerDebuggers(dependencies, options)
            }
            registerDebuggers(target, options)
        }
    }

    if (eager && target) {
        const value = target instanceof Function ? target() : target
        handler(value, value) //TODO: Schedule according to phase
        if (phase === 'sync') {
        }
        else if (phase === 'pre') {

        }
        else if (phase === 'render') {

        }
        else if (phase === 'post') {

        }
    }

    // set up listeners
    const watchers: ActiveListener[] = [];

    function stop() {
        for (const watcher of watchers) {
            watcher.stop();
        }
    }

    let _handler = isReactiveEffect ? wrapToRetrack(<() => void>handler, watchers, options || {}, phase, deep) : handler;
    _handler = options?.once ? (options.once = false, toSelfremoving(_handler, stop)) : _handler;
    // ^ set once to false so that it will not be extraneously re-wrapped by $listen

    for (const taskQueue of taskQueues) {
        const watcher = $listen(_handler, options || {}, {
            enroll(task) {
                if (target && isDerivedSignal(target)) {
                    derivedSignalMap.set(task, target);
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
        watchers.push(<ActiveListener>watcher);
    }

    return {
        stop
    }
}

function toSelfremoving(handler: (...args: any[]) => void, stop: () => void) {
    return (...args: any[]) => {
        stop();
        handler(...args)
    }
}

function wrapToRetrack(effect: () => void, listeners: (ActiveListener | PendingOp)[], options: ListenerOptions, phase?: Phase, deep?: boolean) {
    const _effect = () => {
        listeners.length = 0;
        const dependencies = getDependencies(effect, true)
        const taskQueues = useTaskQueues(dependencies, phase);
        for (const taskQueue of taskQueues) {
            const activeListener = $listen(_effect, options, {
                enroll(task) {
                    reactiveEffects.add(task)
                    taskQueue.add(task)
                },
                remove(task) {
                    taskQueue.delete(task)
                }
            });
            listeners.push(activeListener);
        }
    }
    return _effect;
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




export function track(target: Signal): void
export function track(target: ReactiveModel, key: string | symbol): void
export function track(target: Signal | ReactiveModel, key?: string | symbol) {
    const tracker = getDependencyTracker();
    if (!tracker) return;
    if (tracker.shouldTrack) {
        if (isSignal(target)) {
            tracker.addSignal(target);
        }
        else {
            if (!key) throw new Error("Cannot track undefined key")
            tracker.addProp(asReactiveProp(target, key));
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

type PropertyKey = string | number | symbol

const TASK_QUEUE = 0;
const TO_BE_QUEUED = 1;

const signalTaskQueues: WeakMap<Signal, Map<Phase, [Set<Effect>, undefined | Effect[]]>> = new WeakMap();
const reactivePropTaskQueues: WeakMap<ReactiveProp, Map<Phase, [Set<Effect>, undefined | Effect[]]>> = new WeakMap();
const reactiveModelTaskQueues: WeakMap<ReactiveModel, Map<'pre' | 'post' | 'render', [Set<Effect>, undefined | Effect[]]>> = new WeakMap();

export function useTaskQueues(deps: (Signal | ReactiveProp)[], phase: Phase = 'pre') {
    const taskQueues: Set<Effect>[] = [];
    for (const dep of deps) {
        taskQueues.push(useTaskQueue(dep, phase));
    }
    return taskQueues;
}

function useTaskQueue(target: Signal | ReactiveProp | ReactiveModel, phase: Phase = 'pre') {
    const taskQueueMap = (isSignal(target) ? signalTaskQueues
        : isReactiveProp(target) ? reactivePropTaskQueues
            : reactiveModelTaskQueues) as
        WeakMap<Signal | ReactiveProp | ReactiveModel, Map<Phase, [Set<Effect>, Effect[] | undefined]>>

    let phaseMap = taskQueueMap.get(target)
    if (!phaseMap) {
        phaseMap = new Map();
        taskQueueMap.set(target, phaseMap)
    }
    let phaseStore = phaseMap.get(phase)
    if (!phaseStore) {
        phaseStore = [new Set(), undefined]
        phaseMap.set(phase, phaseStore)
    }

    return phaseStore[TASK_QUEUE];
}

function useTaskQueuesForReactive(reactive: ReactiveModel, phase: Phase = 'pre') {
    const taskQueues: Set<Effect>[] = [];
    if (phase === 'sync')
        throw new Error('"Reactive effect cannot run synchronously on property change when watching reactive objects. Did you mean to watch a reactive property?"')
    taskQueues.push(useTaskQueue(reactive, phase));
    return taskQueues;
}


function getTaskQueueForReactive(reactive: ReactiveModel, phase: 'pre' | 'post' | 'render') {
    return reactiveModelTaskQueues.get(reactive)?.get(phase)?.[TASK_QUEUE];
}

function getTaskQueueForSignal(signal: Signal, phase: Phase) {
    return signalTaskQueues.get(signal)?.get(phase)?.[TASK_QUEUE];
}

export function getTaskQueueForProp(prop: ReactiveProp, phase: Phase) {
    return reactivePropTaskQueues.get(prop)?.get(phase)?.[TASK_QUEUE]
}





export function trigger(target: Signal | ReactiveModel, newValue: any, oldValue: any, key?: PropertyKey, args?: any[]) {
    if (__DEV__) {
        if (args) {
            runTriggerDebugger(target)
        }
        else if (key) runTriggerDebugger(asReactiveProp(target, key))
        else runTriggerDebugger(<Signal>target)
    }

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

    // collect triggered refs for this cycle for 'pre', 'render', and 'post' phases
    if (isSignal(target)) currentUpdateCycle.flagSignal(target, newValue, oldValue)
    else {
        currentUpdateCycle.flagReactive(target, key!, newValue, oldValue)
    }

    // take snapshot clone if watching reactive object, this will be the old value
    if (reactiveModelTaskQueues.has(target)) {
        const snapshot = currentUpdateCycle.takeSnapshot(target, oldValue);
        if (args) {
            currentUpdateCycle.recordOp(target, {
                op: <string>key,
                args
            })
        }
        else if (key) {
            currentUpdateCycle.recordOp(target, {
                keyPath: [<string>key],
                newValue,
                oldValue
            })
        }
    }
}

function runSyncTasks(target: Signal | ReactiveModel, newValue: any, oldValue: any, key?: string | number | symbol) {
    const updateCycle = getCurrentUpdateCycle();
    if (!updateCycle) throw new Error("No update cycle :(")
    const completedTasks = updateCycle.completedTasks;
    if (isSignal(target)) {
        const taskQueue = getTaskQueueForSignal(target, 'sync')
        if (taskQueue) {
            runNonRepeatingTasks(taskQueue, newValue, oldValue, completedTasks)
        }
    }
    else {
        if (!key) throw new Error("Cannot track undefined key")
        const taskQueue = getTaskQueueForProp(asReactiveProp(target, key), 'sync')
        if (taskQueue) {
            runNonRepeatingTasks(taskQueue, newValue, oldValue, completedTasks)
        }
    }
}


function runNonRepeatingTasks(taskQueue: Set<Effect>, newValue: any, oldValue: any, completedTasks: Set<Function>) {
    console.log("run non repeating tasks", taskQueue)
    for (const task of taskQueue) {
        if (completedTasks.has(task)) continue;
        if (derivedSignalMap.has(task)) {
            const derivedSignal = derivedSignalMap.get(task);
            if (!derivedSignal) throw new Error("derived signal not found")
            const _derivedSignal = derivedSignal[DERIVED_SIGNAL]
            const oldValue = _derivedSignal.value;
            const newValue = derivedSignal();
            if (!hasChanged(newValue, oldValue))
                return;
            task(newValue, oldValue);
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






export function runNonSyncTasks(phase: "pre" | "post" | "render") {
    console.log("runNonSyncTasks")
    const updateCycle = getCurrentUpdateCycle();
    if (!updateCycle) return;
    const completedTasks = updateCycle.completedTasks;
    const triggeredReactives = updateCycle.triggeredReactives;
    if (triggeredReactives) {
        for (const [reactive, keys] of triggeredReactives) {
            // if (phase !== 'render') {
            const taskQueue = getTaskQueueForReactive(reactive, phase);
            if (taskQueue) {
                for (const task of taskQueue) {
                    const snapshotMap = updateCycle.snapshotMap;
                    if (!snapshotMap) throw "no snapshot map :("
                    const snapshot = snapshotMap.get(reactive)
                    if (!snapshot) throw "no snapshot :("
                    const ops = updateCycle.getOps(reactive);
                    if (ops && ops.length === 0)
                        return;
                    else if (!hasChanged(reactive, snapshot)) {
                        return;
                    }
                    task(reactive, snapshot, ops) //QUESTION: Why is this not non-repeating tasks?
                }
            }
            // }

            for (const [key, [newValue, oldValue]] of keys) {
                const taskQueue = getTaskQueueForProp(asReactiveProp(reactive, key), phase);
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

export function hasChanged(newValue: any, oldValue: any) { //TODO: this is really tricky.. do I do a shallow diff or a deep diff for arrays?? I think it should be shallow diff because if you are watching an array, you typically care about the order
    const original = toRaw(newValue);
    if (original instanceof Array) return !areShallowEqualArrays(oldValue, newValue);
    if (original instanceof Set) return !areEqualSets(oldValue, newValue); // inherently shallow
    if (original instanceof Map) return !areEqualMaps(newValue, oldValue); // deep
    if (isReactiveObject(newValue)) return !reactivePropsAreEqual(oldValue, newValue); // partial deep
    if (original instanceof Object) return !isEqual(oldValue, newValue); // deep
    if (oldValue === newValue) return false;
    return true;
}

export function isShallowEqual(collectionA: any[] | Set<any>, collectionB: any[] | Set<any>) {
    const original = toRaw(collectionA)
    if (original instanceof Array) return areShallowEqualArrays(<any[]>collectionA, <any[]>collectionB);
    if (original instanceof Set) return areEqualSets(<Set<any>>collectionA, <Set<any>>collectionB);
    if (__DEV__) console.warn("Not yet implemented for Objects and Map")
}

export function areEqualArrays(arrayA: any[], arrayB: any[]) {
    if (arrayA.length !== arrayB.length) return false;
    for (let i = 0; i < arrayA.length; i++) {
        if (hasChanged(arrayA[i], arrayB[i])) return false;
    }
    return true;
}

export function areShallowEqualArrays(arrayA: any[], arrayB: any[]) {
    if (arrayA.length !== arrayB.length) return false;
    for (let i = 0; i < arrayA.length; i++) {
        if (arrayA[i] !== arrayB[i]) return false;
    }
    return true;
}


export function reactivePropsAreEqual(reactiveA: ReactiveModel, reactiveB: ReactiveModel) {
    if (!isReactiveObject(reactiveA) || !isReactiveObject(reactiveB)) throw new Error("Invalid input type");
    for (const key in reactiveA) {
        const valueA = reactiveA[key];
        const valueB = reactiveB[key];
        if (hasChanged(valueA, valueB)) return false;
    }
    return true;
}

function areEqualSets(setA: Set<any>, setB: Set<any>) {
    if (setA.size !== setB.size) return false;
    for (const item of setA) {
        if (!setB.has(item)) return false;
    }
    return true;
}

function areEqualMaps(mapA: Map<any, any>, mapB: Map<any, any>) {
    if (mapA.size !== mapB.size) return false;
    for (const [key, value] of mapA) {
        if (!mapB.has(key)) return false;
        if (hasChanged(value, mapB.get(key)))
            return false;
    }
    return true;
}