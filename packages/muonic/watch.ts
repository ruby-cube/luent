import { $listen, ListenerOptions, PendingOp, ScheduleStop } from "@rue/flask";
import { isSignal, Signal } from "./useSignals";
import { isReactiveModel, isReactiveObject, ReactiveModel } from "./useReactiveModel";
import { AnyObject } from "@rue/types";
import { ActiveListener } from "../flask/ActiveListener";
import { getCurrentUpdateCycle, setCurrentUpdateCycle, UpdateCycle } from "./UpdateCycle";
import { DependencyTracker, getDependencyTracker, ReactiveProp } from "./DependencyTracker";
import { DERIVED_SIGNAL, DerivedSignal, isDerivedSignal, ReactiveSignal } from "./DerivedSignal";
import { isEqual } from "@rue/utils";
import { deepWatch, MutationOp, SetOp } from "./deepWatch";
import { C } from "vitest/dist/reporters-B7ebVMkT";

//QUESTION: How useful is watching deep?

export type WatchOptions = {
    deep?: boolean;
    eager?: true;
} & EffectOptions

type _WatchOptions = {
    deep?: boolean;
    eager?: true;
} & _EffectOptions

type EffectOptions = {
    phase?: 'pre' | 'post' | 'sync';
} & ListenerOptions

type _EffectOptions = {
    phase?: Phase;
} & ListenerOptions

type Phase = 'pre' | 'render' | 'post' | 'sync'


type MutationHandler<T extends any[] | Map<any, any> | Set<any> = any[] | Map<any, any> | Set<any>> = (newValue: T, oldValue: T, ops?: MutationOp[]) => void
type ChangeHandler<T = AnyObject> = T extends any[] | Map<any, any> | Set<any> ? MutationHandler<T> : (newValue: T, oldValue: T, ops?: (MutationOp | SetOp)[]) => void
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
    return _watchEffect(handler, target, options);
}

export function watchEffect(effect: () => void, options?: EffectOptions) { //NOTE: an effect is essentially a derived signal and effect combined into one function
    return _watchEffect(effect, undefined, options);
}

// export function initializeUpdate(effect: () => void) {
//     return _watchEffect(effect, undefined, { phase: 'render' });
// }

// export function watchForRender<T>(target: Signal<T> | (() => T) | ReactiveModel<T extends AnyObject ? T : never>, handler: (newValue: T, oldValue: T) => void, component: InternalComponent) {
//     return _watchEffect(handler, target, { phase: 'render' });
// }

const derivedSignalMap: WeakMap<Function, DerivedSignal> = new WeakMap();
const reactiveEffects: WeakSet<Function> = new WeakSet();


export function _watchEffect<T>(handler: ReactiveEffect, target: undefined, options?: _WatchOptions): ActiveListener
export function _watchEffect<T>(handler: ChangeHandler<T>, target?: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, options?: _WatchOptions): ActiveListener
export function _watchEffect<T>(handler: ChangeHandler<T> | ReactiveEffect, target?: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, options?: _WatchOptions): ActiveListener {
    const { phase, deep, eager } = options ?? {};
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
        // handler([{target, key, newValue, oldValue}]) //TODO: change argument to this format
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
        watchers.push(<ActiveListener>watcher);
    }
    // console.log("activeListeners", activeListeners)

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
        const taskQueues = useTaskQueues(dependencies, phase, deep);
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




export function track(value: any, target: Signal): void
export function track(value: any, target: ReactiveModel, key: string | symbol): void
export function track(value: any, target: Signal | ReactiveModel, key?: string | symbol) {
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

type PropertyKey = string | number | symbol

const signalTaskQueues: WeakMap<Signal, Map<Phase, Set<Effect>>> = new WeakMap();
const reactivePropsTaskQueues: WeakMap<ReactiveModel, Map<PropertyKey, Map<Phase, Set<Effect>>>> = new WeakMap();
const reactiveObjTaskQueues: WeakMap<ReactiveModel, Map<'pre' | 'post' | 'render', Set<Effect>>> = new WeakMap();

export function useTaskQueues(deps: (Signal | ReactiveProp)[], phase: Phase = 'pre', deep: boolean = false) {
    const taskQueues: Set<Effect>[] = [];
    for (const dep of deps) {
        if (isSignal(dep)) {
            const phaseMap = signalTaskQueues.get(dep) || new Map();
            const taskQueue = phaseMap.get(phase) || new Set()
            phaseMap.set(phase, taskQueue);
            signalTaskQueues.set(dep, phaseMap);
            taskQueues.push(taskQueue);
            // console.log(dep.__devName, taskQueue, phase)
            // taskQueue.__devName = dep.__devName;
        }
        else {
            const [reactiveObj, key] = dep;
            const propMap = reactivePropsTaskQueues.get(reactiveObj) || new Map();
            const phaseMap = propMap.get(key) || new Map();
            const taskQueue = phaseMap.get(phase) || new Set()
            phaseMap.set(phase, taskQueue);
            propMap.set(key, phaseMap)
            reactivePropsTaskQueues.set(reactiveObj, propMap);
            taskQueues.push(taskQueue);
        }
    }
    return taskQueues;
}

function useTaskQueuesForReactive(reactive: ReactiveModel, phase: Phase = 'pre', deep: boolean = false) {
    const taskQueues: Set<Effect>[] = [];
    if (phase === 'sync') throw "Reactive effect cannot run synchronously on property change when watching reactive objects. Did you mean to watch a reactive property?"
    const phaseMap = reactiveObjTaskQueues.get(reactive) || new Map();
    const taskQueue = phaseMap.get(phase) || new Set()
    phaseMap.set(phase, taskQueue);
    reactiveObjTaskQueues.set(reactive, phaseMap);
    taskQueues.push(taskQueue);
    return taskQueues;
}

function getTaskQueueForReactive(reactive: ReactiveModel, phase: 'pre' | 'post' | 'render') {
    return reactiveObjTaskQueues.get(reactive)?.get(phase);
}

function getTaskQueueForSignal(signal: Signal, phase: 'pre' | 'post' | 'render') {
    return signalTaskQueues.get(signal)?.get(phase);
}

export function getTaskQueueForProp(target: ReactiveModel, key: PropertyKey, phase: 'pre' | 'post' | 'render') {
    return reactivePropsTaskQueues.get(target)?.get(key)?.get(phase)
}





export function trigger(target: Signal | ReactiveModel, newValue: any, oldValue: any, key?: PropertyKey, args?: any[]) {
    if (isEqual(newValue, oldValue)) return;  //FIX: potentially expensive for complex objects?
    // if (newValue === oldValue) return;
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
    if (reactiveObjTaskQueues.has(target)) {
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
            if (!isEqual(newValue, oldValue)) {  //FIX: potentially expensive for complex objects
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




export function runNonSyncTasks(phase: "pre" | "post" | "render") {
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
                    if (ops && ops.length === 0) {
                        return;
                    }
                    else if (
                        (reactive instanceof Array || reactive instanceof Set) &&
                        isShallowEqual(
                            reactive,
                            //@ts-expect-error
                            snapshot
                        )) {
                        return;
                    }
                    else if (reactive instanceof Map) {
                        // TODO: Not sure what to do here yet
                    }
                    task(reactive, snapshot, ops) //QUESTION: Why is this not non-repeating tasks?
                }
            }
            // }

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

function isShallowEqual(collectionA: any[] | Set<any>, collectionB: any[] | Set<any>) {
    const arrayA = normalizeCollectionToArray(collectionA)
    const arrayB = normalizeCollectionToArray(collectionB)
    const length = arrayA.length;
    if (length !== arrayB.length) return false;
    for (let i = 0; i < length; i++) {
        if (arrayA[i] !== arrayB[i]) return false;
    }
    return true;
}

function normalizeCollectionToArray(collection: any[] | Set<any>) {
    if (collection instanceof Array) return collection;
    if (collection instanceof Set) return Array.from(collection);
    throw new Error("Invalid input. Must input set or array")
}