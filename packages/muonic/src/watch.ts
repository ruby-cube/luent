import { $listen, ListenerOptions, PendingOp, ScheduleStop } from "@rue/flask";
import { isSignal, Signal } from "./$Signal";
import { isReactiveModel, isReactiveObject, ReactiveModel, toRaw } from "./Reactive$";
import { AnyObject } from "@rue/types";
import { ActiveListener } from "../../flask/ActiveListener";
import { _runTasks, getCurrentUpdateCycle, Hooks, onPhaseCompleted, Phase, startUpdateCycle, UpdateCycle } from "./UpdateCycle";
import { DependencyTracker, getDependencyTracker, getWithoutTracking, ReactiveAtom } from "./DependencyTracker";
import { DERIVED_SIGNAL, DerivedSignal, getDependentDerivedSignals, hasSignal, isDerivedSignal, ReactiveSignal } from "./DerivedSignal";
import { isEqual, UNDEFINED } from "@rue/utils";
import { MutationRecord, MutationOp, SetOp, watchProps } from "./deepWatch";
import { collectReactiveProps, registerDebuggers, runTriggerDebugger, WatchDebugOptions } from "./debug";
import { asReactiveProp, getReactiveProp, isReactiveProp, ReactiveProp } from "./ReactiveProp";
import { PendingCancelOp } from "../../flask/PendingCancelOp";


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




type MutationHandler<T extends AnyObject = AnyObject> = (newValue: T, oldValue: T, ops?: MutationRecord[]) => void
export type ChangeHandler<T = AnyObject> = (newValue: T, oldValue: T, ops?: MutationRecord[]) => void
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
        watchProps(target, target, []);
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
    // const watchers: ActiveListener[] = [];
    let watcher: ActiveListener | PendingCancelOp
    // function stop() {
    //     if (isDerivedSignal(target)) target[DERIVED_SIGNAL].markUnwatched();
    //     'stop' in watcher ? watcher.stop() : watcher.cancel()
    // }

    // const _handler = options?.once ? (options.once = false, toSelfremoving(handler, stop)) : handler;
    // ^ set once to false so that it will not be extraneously re-wrapped by $listen

    const forNextCycle = phase === 'sync' ? false : shouldScheduleForNextCycle();

    watcher = $listen(handler, options || {}, {
        enroll(task) {
            if (isDerivedSignal(target)) { //TODO: Dunno if I need this anymore
                derivedSignalMap.set(task, target);
            }
            for (const phaseQueue of phaseQueues) {
                const taskQueue = useTaskQueue(phaseQueue, forNextCycle)
                if (forNextCycle) queueForNextCycle(phaseQueue, phase)
                taskQueue.add(task)
            }
        },
        remove(task) {
            if (isDerivedSignal(target))
                target[DERIVED_SIGNAL].markUnwatched();
            for (const phaseQueue of phaseQueues) {
                const taskQueue = useTaskQueue(phaseQueue, forNextCycle)
                taskQueue.delete(task)
            }
        }
    });

    return watcher
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
    let watcher: ActiveListener

    // function stop() {
    //     'stop' in watcher ? watcher.stop() : watcher.cancel()
    // }

    // const _watcher = {
    //     stop
    // }

    // function replaceCleanupFunction(stop: () => void) {
    //     _watcher.stop = stop
    // }


    let _handler = retrack ? () => {
        watcher.stop()
        const _watcher = initializeEffect(effect, options) // no need to call effect because initializeEffect will call it
        watcher.stop = _watcher.stop
    } : effect;
    // _handler = options?.once && !retrack ? toSelfremoving(_handler, stop) : _handler; // retrack is inherently self-removing

    // // set once to false so that it will not be extraneously re-wrapped by $listen
    // if (options?.once || retrack) {
    //     options.once = false;
    // }
    if (retrack) options.once = true;

    const forNextCycle = shouldScheduleForNextCycle();

    watcher = $listen(_handler, options || {}, {
        enroll(task) {
            for (const phaseQueue of phaseQueues) {
                const taskQueue = useTaskQueue(phaseQueue, forNextCycle);
                if (forNextCycle) queueForNextCycle(phaseQueue, phase)
                taskQueue.add(task)
            }
            reactiveEffects.add(task)
        },
        remove(task) {
            for (const phaseQueue of phaseQueues) {
                const taskQueue = useTaskQueue(phaseQueue, forNextCycle);
                if (forNextCycle) queueForNextCycle(phaseQueue, phase)
                taskQueue.delete(task)
            }
        }
    });

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


// function toSelfremoving(handler: (...args: any[]) => void, stop: () => void) {
//     return (...args: any[]) => {
//         stop();
//         handler(...args)
//     }
// }

// function wrapToRetrack(effect: () => void, options: EffectOptions, prevWatcher: ActiveListener, replaceCleanup: (stop: () => void) => void) {
//     const _effect = () => {
//         prevWatcher.stop();
//         const watcher = initializeEffect(effect, options) // no need to call effect because initializeEffect will call it
//         replaceCleanup(watcher.stop);
//     }
//     return _effect;
// }

export function getDependencies(reactiveFunction: Function, isReactiveEffect?: boolean): ReactiveAtom[] {
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




// export function track(target: Signal): void
// export function track(target: ReactiveModel, key: string | symbol): void
export function track(target: ReactiveAtom) {
    const tracker = getDependencyTracker();
    if (!tracker) return;
    if (tracker.shouldTrack) {
        tracker.addDep(target)
    }
}

type SignalToDerivedMap = WeakMap<Signal, WeakSet<() => any>> //QUESTION: not sure if weak set will work, or if I need to subscribe and unsubscribe

class DerivedSignalTasks {
    constructor(
        public value: any,
        public deps: ReactiveAtom[] = [],
        public pre?: Set<Effect> | undefined,
        public post?: Set<Effect> | undefined,
    ) { }
}

class EffectRecord {
    constructor(
        public deps: ReactiveAtom[] = [],
        public phase: 'pre' | 'post',
        public effect: Effect,
    ) { }
}

type PropertyKey = string | number | symbol

const TASK_QUEUE = 0;
const TO_BE_QUEUED = 1;

type PhaseQueue = [Set<Effect>, undefined | Set<Effect>]
const reactiveAtomTaskQueues: WeakMap<ReactiveAtom, Map<Phase, PhaseQueue>> = new WeakMap();
const reactiveModelTaskQueues: WeakMap<ReactiveModel, Map<'pre' | 'post' | 'render', PhaseQueue>> = new WeakMap();

export function usePhaseQueues(deps: ReactiveAtom[], phase: Phase = 'pre') {
    const taskQueues: PhaseQueue[] = [];
    for (const dep of deps) {
        taskQueues.push(usePhaseQueue(dep, phase));
    }
    return taskQueues;
}

function usePhaseQueue(target: Signal | ReactiveProp | ReactiveModel, phase: Phase = 'pre') {
    const taskQueueMap = (isReactiveModel(target) ? reactiveModelTaskQueues : reactiveAtomTaskQueues) as
        WeakMap<ReactiveAtom | ReactiveModel, Map<Phase, PhaseQueue>>

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

export function getTaskQueue(target: Signal | ReactiveProp | ReactiveModel, phase: Phase) {
    if (isReactiveModel(target))
        return reactiveModelTaskQueues.get(target)?.get(<Exclude<Phase, 'sync'>>phase)?.[TASK_QUEUE]
    return reactiveAtomTaskQueues.get(target)?.get(phase)?.[TASK_QUEUE]
}

// function getTaskQueueForReactive(reactive: ReactiveModel, phase: 'pre' | 'post' | 'render') {
//     return reactiveModelTaskQueues.get(reactive)?.get(phase)?.[TASK_QUEUE];
// }

// function getTaskQueueForSignal(signal: Signal, phase: Phase) {
//     return signalTaskQueues.get(signal)?.get(phase)?.[TASK_QUEUE];
// }

// export function getTaskQueueForProp(prop: ReactiveProp, phase: Phase) {
//     return reactivePropTaskQueues.get(prop)?.get(phase)?.[TASK_QUEUE]
// }


export function useUpdateCycle() {
    let updateCycle = getCurrentUpdateCycle()
    if (!updateCycle) {
        updateCycle = new UpdateCycle();

    }
    return updateCycle;
}

export function trigger(target: ReactiveAtom, newValue: any, oldValue: any) { //TODO: what happens if key for trackable ops is  undefined or null ? I need to use a UNDEFINED symbol
    if (__DEV__) {
        runTriggerDebugger(target)
    }

    const updateCycle = useUpdateCycle()

    // run sync tasks
    const tracker = getDependencyTracker();
    tracker?.stop(); // in case reactive refs are set during an effect
    runSyncTasks(target, newValue, oldValue);
    tracker?.restore();

    // collect triggered refs for this cycle for 'pre', 'render', and 'post' phases
    updateCycle.flagReactiveAtom(target, newValue, oldValue)
    return updateCycle;
}

export function triggerReactiveModel(reactive: ReactiveModel, op: MutationRecord, clone?: AnyObject) {
    const updateCycle = useUpdateCycle();
    const snapshot = updateCycle.takeSnapshot(reactive, toRaw(reactive), clone)
    updateCycle.flagReactive(reactive, snapshot)
    updateCycle.recordOp(reactive, op)
}

// export function triggerOp(target: ReactiveModel, op: string, args: any[]) {
//     if (__DEV__) {
//         runTriggerDebugger(target)
//     }

//     const updateCycle = useUpdateCycle()
//     // updateCycle.flagTrackableOps(target, op, args)

//     if (isWatchedModel(target)) {
//         updateCycle.recordOp(target, {
//             op,
//             args
//         })
//     }

//     return updateCycle;
// }

export function isWatchedModel(target: ReactiveModel) {
    return reactiveModelTaskQueues.has(target)
}


export function storeInitialDerivedValueIfNeeded(updateCycle: UpdateCycle, target: ReactiveAtom) {
    const derivedSignals = getDependentDerivedSignals(target);
    if (derivedSignals) {
        for (const derivedSignal of derivedSignals) {
            const initialValue = updateCycle.getInitialValue(derivedSignal)
            if (initialValue === UNDEFINED) {
                updateCycle.storeInitialValue(derivedSignal, derivedSignal())
            }
        }
    }
}

function runSyncTasks(target: ReactiveAtom, newValue: any, oldValue: any) {
    const updateCycle = getCurrentUpdateCycle();
    if (!updateCycle) throw new Error("No update cycle :(")
    const completedTasks = updateCycle.completedTasks;
    const taskQueue = getTaskQueue(target, 'sync')
    if (taskQueue) {
        runNonRepeatingTasks(taskQueue, newValue, oldValue, completedTasks)
    }
}


function runNonRepeatingTasks(taskQueue: Set<Effect>, newValue: any, oldValue: any, completedTasks: Set<Function>) {
    for (const task of taskQueue) {
        if (completedTasks.has(task)) {
            continue;
        }
        if (derivedSignalMap.has(task)) {
            const derivedSignal = derivedSignalMap.get(task);
            if (!derivedSignal) throw new Error("derived signal not found")
            const updateCycle = getCurrentUpdateCycle();
            if (!updateCycle) throw new Error("No update cycle :( whyyy")
            const _oldValue = updateCycle.getInitialValue(derivedSignal)
            const newValue = derivedSignal();
            if (!hasChanged(newValue, _oldValue)) {
                return;
            }
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

    const reactiveMap = updateCycle.triggeredReactives;
    if (reactiveMap) {
        for (const [reactive, keys] of reactiveMap) {
            // if (phase !== 'render') {
            const taskQueue = getTaskQueue(reactive, phase);
            if (taskQueue) {
                for (const task of taskQueue) {
                    const snapshot = updateCycle.getSnapshot(reactive);
                    if (!snapshot) throw new Error("No snapshot :(. This should never happen")
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
        }
    }

    const atomMap = updateCycle.triggeredReactiveAtom;
    if (atomMap) {
        for (const [atom, [newValue, oldValue]] of atomMap) {
            const taskQueue = getTaskQueue(atom, phase);
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