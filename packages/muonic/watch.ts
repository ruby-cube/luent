import { $listen, ListenerOptions, PendingOp, ScheduleStop } from "@rue/flask";
import { isSignal, Signal } from "./useSignals";
import { isReactiveModel, isReactiveObject, ReactiveModel, toRaw } from "./useReactiveModels";
import { AnyObject } from "@rue/types";
import { ActiveListener } from "../flask/ActiveListener";
import { _runTasks, getCurrentUpdateCycle, Hooks, onPhaseCompleted, Phase, setCurrentUpdateCycle, UpdateCycle } from "./UpdateCycle";
import { DependencyTracker, getDependencyTracker } from "./DependencyTracker";
import { DERIVED_SIGNAL, DerivedSignal, getDependentDerivedSignals, hasSignal, isDerivedSignal, ReactiveSignal } from "./DerivedSignal";
import { isEqual } from "@rue/utils";
import { deepWatch, MutationOp, SetOp } from "./deepWatch";
import { collectReactiveProps, registerDebuggers, runTriggerDebugger, WatchDebugOptions } from "./debug";
import { asReactiveProp, isReactiveProp, ReactiveProp } from "./ReactiveProp";

//QUESTION: How useful is watching deep?

type UpdateCycleOptions = {
    phase?: Phase;
}

export type WatchOptions = {
    deep?: boolean;
    eager?: true;
} & UpdateCycleOptions & ListenerOptions & WatchDebugOptions

export type EffectOptions = {
    retrack?: true;
} & UpdateCycleOptions & ListenerOptions & WatchDebugOptions




type MutationHandler<T extends any[] | Map<any, any> | Set<any> = any[] | Map<any, any> | Set<any>> = (newValue: T, oldValue: T, ops?: MutationOp[]) => void
export type ChangeHandler<T = AnyObject> = T extends any[] | Map<any, any> | Set<any> ? MutationHandler<T> : (newValue: T, oldValue: T, ops?: (MutationOp | SetOp)[]) => void
type ReactiveEffect = () => void //TODO: onCleanup function?
type Effect = ChangeHandler | ReactiveEffect

// manages nested watch calls to prevent infinite loops
let isRunningEffect = false;
function runEffect(effect: () => void) {
    isRunningEffect = true;
    effect()
    isRunningEffect = false;
}
function shouldScheduleForNextCycle() {
    return isRunningEffect;
}

const derivedSignalMap: WeakMap<Function, DerivedSignal> = new WeakMap();

const reactiveEffects: WeakSet<Function> = new WeakSet();

function isReactiveEffect(task: Function): task is ReactiveEffect {
    return reactiveEffects.has(task)
}



export function watch<T>(target: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, handler: ChangeHandler<T>, options?: WatchOptions) {
    const { deep, eager } = options ?? {};
    const phase = options?.phase || 'pre'


    if (deep && isReactiveModel(target)) { //TODO: deep watch for $$ and $$$ signals?
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

    let phaseQueues: PhaseQueue[];

    // collect tracked refs and get taskQueues
    if (target instanceof Function) { //QUESTION: Should I allow plain functions as targets or require them all to be derived signals?
        if (isDerivedSignal(target)) target[DERIVED_SIGNAL].markAsWatched();
        const dependencies = getDependencies(target, false) //TODO: should initialize during the correct phase, not all sync or at least after component elements are created

        phaseQueues = usePhaseQueues(dependencies, phase);
        if (__DEV__) {
            registerDebuggers(dependencies, options)
        }
    }
    else {
        // watch all properties of reactive
        phaseQueues = usePhaseQueuesForReactive(target, phase)
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
        //TODO: Schedule according to phase
        if (phase === 'sync') {
            runEffect(() => handler(value, value))
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
        if (isDerivedSignal(target)) target[DERIVED_SIGNAL].markUnwatched();
        for (const watcher of watchers) {
            watcher.stop();
        }
    }

    const _handler = options?.once ? (options.once = false, toSelfremoving(handler, stop)) : handler;
    // ^ set once to false so that it will not be extraneously re-wrapped by $listen

    const forNextCycle = phase === 'sync' ? false : shouldScheduleForNextCycle();

    for (const phaseQueue of phaseQueues) {
        const taskQueue = useTaskQueue(phaseQueue, forNextCycle)
        if (forNextCycle) queueForNextCycle(phaseQueue, phase)
        const watcher = $listen(_handler, options || {}, {
            enroll(task) {
                if (isDerivedSignal(target)) { //TODO: Dunno if I need this anymore
                    derivedSignalMap.set(task, target);
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

function queueForNextCycle(phaseQueue: PhaseQueue, phase: Phase) {
    const toBeQueued = phaseQueue[TO_BE_QUEUED]!
    const taskQueue = phaseQueue[TASK_QUEUE];
    onPhaseCompleted(phase, () => {
        for (const task of toBeQueued!) {
            taskQueue.add(task);
        }

        toBeQueued.clear()
    })
}



export function initializeEffect(effect: () => void, options?: EffectOptions) { //NOTE: an effect is essentially a derived signal and effect combined into one function
    const phase = options?.phase || 'pre';
    const retrack = options?.retrack;

    let phaseQueues: PhaseQueue[];

    // collect tracked refs and get taskQueues
    const dependencies = getDependencies(effect, true)

    phaseQueues = usePhaseQueues(dependencies, phase);
    if (__DEV__) {
        registerDebuggers(dependencies, options)
    }

    // set up listeners
    const watchers: ActiveListener[] = [];

    function stop() {
        for (const watcher of watchers) {
            watcher.stop();
        }
    }

    const watcher = {
        stop
    }

    function replaceCleanupFunction(stop: () => void) {
        watcher.stop = stop
    }


    let _handler = retrack ? wrapToRetrack(<() => void>effect, options || {}, watcher, replaceCleanupFunction) : effect;
    _handler = options?.once && !retrack ? toSelfremoving(_handler, stop) : _handler; // retrack is inherently self-removing

    // set once to false so that it will not be extraneously re-wrapped by $listen
    if (options?.once || retrack) {
        options.once = false;
    }

    const forNextCycle = shouldScheduleForNextCycle();

    for (const phaseQueue of phaseQueues) {
        const taskQueue = useTaskQueue(phaseQueue, forNextCycle);
        if (forNextCycle) queueForNextCycle(phaseQueue, phase)
        const watcher = $listen(_handler, options || {}, {
            enroll(task) {
                reactiveEffects.add(task)
                taskQueue.add(task)
            },
            remove(task) {
                taskQueue.delete(task)
            }
        });
        watchers.push(<ActiveListener>watcher);
    }

    return watcher;
}

function useTaskQueue(phaseQueue: PhaseQueue, forNextCycle: boolean) {
    const taskQueue = phaseQueue[TASK_QUEUE]
    if (forNextCycle) {
        let toBeQueued = phaseQueue[TO_BE_QUEUED]
        if (!toBeQueued) {
            toBeQueued = phaseQueue[TO_BE_QUEUED] = new Set()
        }

        return {
            add(effect: Effect) {
                toBeQueued.add(effect);
            },
            delete(effect: Effect) {
                taskQueue.delete(effect);
                toBeQueued.delete(effect);
            }
        }
    }
    return taskQueue
}


function toSelfremoving(handler: (...args: any[]) => void, stop: () => void) {
    return (...args: any[]) => {
        stop();
        handler(...args)
    }
}

function wrapToRetrack(effect: () => void, options: EffectOptions, prevWatcher: ActiveListener, replaceCleanup: (stop: () => void) => void) {
    const _effect = () => {
        prevWatcher.stop();
        const watcher = initializeEffect(effect, options) // no need to call effect because initializeEffect will call it
        replaceCleanup(watcher.stop);
    }
    return _effect;
}

export function getDependencies(reactiveFunction: Function, isReactiveEffect?: boolean): (Signal | ReactiveProp)[] {
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

type PhaseQueue = [Set<Effect>, undefined | Set<Effect>]
const signalTaskQueues: WeakMap<Signal, Map<Phase, PhaseQueue>> = new WeakMap();
const reactivePropTaskQueues: WeakMap<ReactiveProp, Map<Phase, PhaseQueue>> = new WeakMap();
const reactiveModelTaskQueues: WeakMap<ReactiveModel, Map<'pre' | 'post' | 'render', PhaseQueue>> = new WeakMap();

export function usePhaseQueues(deps: (Signal | ReactiveProp)[], phase: Phase = 'pre') {
    const taskQueues: PhaseQueue[] = [];
    for (const dep of deps) {
        taskQueues.push(usePhaseQueue(dep, phase));
    }
    return taskQueues;
}

function usePhaseQueue(target: Signal | ReactiveProp | ReactiveModel, phase: Phase = 'pre') {
    const taskQueueMap = (isSignal(target) ? signalTaskQueues
        : isReactiveProp(target) ? reactivePropTaskQueues
            : reactiveModelTaskQueues) as
        WeakMap<Signal | ReactiveProp | ReactiveModel, Map<Phase, [Set<Effect>, Set<Effect> | undefined]>>

    let phaseMap = taskQueueMap.get(target)
    if (!phaseMap) {
        phaseMap = new Map();
        taskQueueMap.set(target, phaseMap)
    }
    let phaseQueue = phaseMap.get(phase)
    if (!phaseQueue) {
        phaseQueue = [new Set(), undefined]
        phaseMap.set(phase, phaseQueue)
    }

    return phaseQueue;
}

function usePhaseQueuesForReactive(reactive: ReactiveModel, phase: Phase = 'pre') {
    const taskQueues: PhaseQueue[] = [];
    if (phase === 'sync')
        throw new Error('"Reactive effect cannot run synchronously on property change when watching reactive objects. Did you mean to watch a reactive property?"')
    taskQueues.push(usePhaseQueue(reactive, phase));
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

    let updateCycle = getCurrentUpdateCycle()
    if (!updateCycle) {
        updateCycle = new UpdateCycle();
        setCurrentUpdateCycle(updateCycle)
    }

    // run sync tasks
    const tracker = getDependencyTracker();
    tracker?.stop(); // in case reactive refs are set during an effect
    runSyncTasks(target, newValue, oldValue, key);
    tracker?.restore();

    // collect triggered refs for this cycle for 'pre', 'render', and 'post' phases
    if (isSignal(target)) {
        updateCycle.flagSignal(target, newValue, oldValue)
    }
    else {
        updateCycle.flagReactive(target, key!, newValue, oldValue)
    }

    // take snapshot clone if watching reactive object, this will be the old value
    if (reactiveModelTaskQueues.has(target)) {
        const snapshot = updateCycle.takeSnapshot(target, oldValue);
        if (args) {
            updateCycle.recordOp(target, {
                op: <string>key,
                args
            })
        }
        else if (key) {
            updateCycle.recordOp(target, {
                keyPath: [<string>key],
                newValue,
                oldValue
            })
        }
    }

    return updateCycle;
}



export function storeInitialDerivedValueIfNeeded(updateCycle: UpdateCycle, target: Signal | ReactiveModel, key?: string) {
    const derivedSignals = getDependentDerivedSignals(isSignal(target) ? target : asReactiveProp(target, key!));
    console.log(derivedSignals)
    if (derivedSignals) {
        console.log("storing derivedValue for", target, key)
        // const updateCycle = useUpdateCycle();
        for (const derivedSignal of derivedSignals) {
            const initialValue = updateCycle.getInitialValue(derivedSignal)
            if (initialValue === updateCycle.NULL) {
                updateCycle.storeInitialValue(derivedSignal, derivedSignal())
            }
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
    for (const task of taskQueue) {
        if (completedTasks.has(task)) continue;
        if (derivedSignalMap.has(task)) {
            const derivedSignal = derivedSignalMap.get(task);
            if (!derivedSignal) throw new Error("derived signal not found")
            const updateCycle = getCurrentUpdateCycle();
            if (!updateCycle) throw new Error("No update cycle :( whyyy")
            const _oldValue = updateCycle.getInitialValue(derivedSignal)
            const newValue = derivedSignal();
            console.log("derived signal", _oldValue, newValue)
            if (!hasChanged(newValue, _oldValue))
                return;
            runEffect(() => {
                task(newValue, _oldValue);
            })
        }
        else if (isReactiveEffect(task)) {
            runEffect(() => {
                task() //TODO: pass in clean up function?
            })
        }
        else {
            runEffect(() => {
                task(newValue, oldValue)
            })
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
                    const snapshot = updateCycle.getSnapshot(reactive);
                    const ops = updateCycle.getOps(reactive);
                    if (ops && ops.length === 0)
                        return;
                    else if (!hasChanged(reactive, snapshot)) {
                        return;
                    }
                    runEffect(() => {
                        task(reactive, snapshot, ops) //QUESTION: Why is this not non-repeating tasks?
                    })
                }
            }
            // }

            for (const [key, [newValue, oldValue]] of keys) {
                const taskQueue = getTaskQueueForProp(asReactiveProp(reactive, key), phase);
                if (taskQueue) {
                    if (key === 'length') console.log(phase, "running length tasks", newValue, oldValue)
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