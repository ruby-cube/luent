import { $listen, ActiveListener, ListenerOptions, OneTimeListener, PendingOp } from "@rue/flask";
import { isSignal, Signal } from "./useSignalKit";
import { Reactive } from "./useReactivityKit";
import { AnyObject } from "@rue/types";
import { SnapshotManager } from "./snapshots";
import { time } from "console";

type WatchOptions = {
    deep?: boolean;
} & EffectOptions

type _WatchOptions = {
    deep?: boolean;
} & _EffectOptions

type EffectOptions = {
    timing?: 'pre' | 'post' | 'sync';
} & ListenerOptions

type _EffectOptions = {
    timing?: TimeBlock;
} & ListenerOptions

type TimeBlock = 'pre' | 'render' | 'post' | 'sync'


type WatchHandler = (newValue: any, oldValue: any) => void
type Effect = () => void //TODO: onCleanup function?
type OnChangeHandler = WatchHandler | Effect



const watcherCallStack: WatcherState[] = []; // Global stack to manage nested watchers

function getCurrentWatcher() {
    return watcherCallStack.at(-1);
}

class WatcherState {

    trackedSignals: Set<Signal> | undefined;
    trackedProps: Map<Reactive, Set<string>> | undefined

    trackSignal(signal: Signal) {
        const trackedSignals = this.trackedSignals || new Set();
        trackedSignals.add(signal);
        this.trackedSignals = trackedSignals;
    }

    trackProp(target: Reactive, key: string) {
        const reactiveMap = this.trackedProps || new Map();
        const trackedProps = reactiveMap.get(target) || new Set();
        trackedProps.add(key);
        reactiveMap.set(target, trackedProps);
        this.trackedProps = reactiveMap;
    }

    // trackReactive(target: Reactive) {
    //     const trackedReactive = this.trackedReactive || new Set();
    //     trackedReactive.add(target);
    //     this.trackedReactive = trackedReactive;
    // }

    shouldTrack: boolean = false;
    prevTrackState = false;

    startTracking() {
        this.shouldTrack = true;
    }

    stopTracking() {
        this.prevTrackState = this.shouldTrack;
        this.shouldTrack = false;
    }

    restoreTrackingState() {
        this.shouldTrack = this.prevTrackState;
    }
}




export function watch<T>(targetSource: Signal<T> | (() => T) | Reactive<T extends AnyObject ? T : never>, handler: (newValue: T, oldValue: T) => void, options?: WatchOptions) {
    return _watch(handler, targetSource, options);
}

export function initializeEffect(effect: () => void, options?: EffectOptions) {
    return _watch(effect, undefined, options);
}

export function initializeRender(effect: () => void) {
    return _watch(effect, undefined, { timing: 'render' });
}

export function watchForRender<T>(targetSource: Signal<T> | (() => T) | Reactive<T extends AnyObject ? T : never>, handler: (newValue: T, oldValue: T) => void) {
    return _watch(handler, targetSource, { timing: 'render' });
}


function _watch<T>(handler: Effect, targetSource: undefined, options?: _WatchOptions): ActiveListener
function _watch<T>(handler: WatchHandler, targetSource?: Signal<T> | (() => T) | Reactive<T extends AnyObject ? T : never>, options?: _WatchOptions): ActiveListener
function _watch<T>(handler: WatchHandler | Effect, targetSource?: Signal<T> | (() => T) | Reactive<T extends AnyObject ? T : never>, options?: _WatchOptions): ActiveListener {
    const { timing, deep } = options ?? {};
    let taskQueues: Set<OnChangeHandler>[];

    // collect tracked refs and get taskQueues
    if (targetSource instanceof Function || targetSource === undefined) {
        const watcher = new WatcherState();
        watcherCallStack.push(watcher);
        watcher.startTracking();
        if (targetSource) targetSource();
        //@ts-expect-error
        else handler(); // TODO: pass in onCleanup to handler?
        watcher.stopTracking();
        watcherCallStack.pop();

        taskQueues = useTaskQueues(watcher, timing, deep);
    }
    else {
        // watch all properties of reactive
        taskQueues = useTaskQueuesForReactive(targetSource, timing, deep)
    }


    // set up listeners

    const activeListeners: (ActiveListener | PendingOp)[] = [];

    for (const taskQueue of taskQueues) {
        const activeListener = $listen(handler, options!, {
            enroll(handler) {
                taskQueue.add(handler)
            },
            remove(handler) {
                taskQueue.delete(handler)
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







export function track(target: Signal): void
export function track(target: Reactive, key: string): void
export function track(target: Signal | Reactive, key?: string) {
    const watcher = getCurrentWatcher();
    if (!watcher) return;
    if (watcher.shouldTrack) {
        if (isSignal(target)) {
            watcher.trackSignal(target);
        }
        else {
            if (!key) throw "Cannot track undefined key"
            watcher.trackProp(target, key);
        }
    }
}

const signalTaskQueues: WeakMap<Signal, Map<TimeBlock, Set<OnChangeHandler>>> = new WeakMap();
const reactivePropsTaskQueues: WeakMap<Reactive, Map<string, Map<TimeBlock, Set<OnChangeHandler>>>> = new WeakMap();
const reactiveObjTaskQueues: WeakMap<Reactive, Map<'pre' | 'post', Set<OnChangeHandler>>> = new WeakMap();

function useTaskQueues(watcher: WatcherState, timing: TimeBlock = 'pre', deep: boolean = false) {
    const taskQueues: Set<OnChangeHandler>[] = [];
    const trackedSignals = watcher.trackedSignals;
    if (trackedSignals) {
        for (const signal of trackedSignals) {
            const flushMap = signalTaskQueues.get(signal) || new Map();
            const taskQueue = flushMap.get(timing) || new Set()
            flushMap.set(timing, taskQueue);
            signalTaskQueues.set(signal, flushMap);
            taskQueues.push(taskQueue);
        }
    }
    const trackedProps = watcher.trackedProps;
    if (trackedProps) {
        for (const reactiveProp of trackedProps) {
            const [reactiveObj, key] = reactiveProp;
            const propMap = reactivePropsTaskQueues.get(reactiveObj) || new Map();
            const flushMap = propMap.get(key) || new Map();
            const taskQueue = flushMap.get(timing) || new Set()
            flushMap.set(timing, taskQueue);
            propMap.set(key, flushMap)
            reactivePropsTaskQueues.set(reactiveObj, propMap);
            taskQueues.push(taskQueue);
        }
    }
    return taskQueues;
}

function useTaskQueuesForReactive(reactive: Reactive, timing: TimeBlock = 'pre', deep: boolean = false) {
    const taskQueues: Set<OnChangeHandler>[] = [];
    if (timing === 'sync') throw "Reactive effect cannot run synchronously on property change when watching reactive objects. Did you mean to watch a reactive property?"
    const flushMap = reactiveObjTaskQueues.get(reactive) || new Map();
    const taskQueue = flushMap.get(timing) || new Set()
    flushMap.set(timing, taskQueue);
    reactiveObjTaskQueues.set(reactive, flushMap);
    taskQueues.push(taskQueue);
    return taskQueues;
}

function getTaskQueueForReactive(reactive: Reactive, timing: 'pre' | 'post') {
    return reactiveObjTaskQueues.get(reactive)?.get(timing);
}

function getTaskQueueForSignal(signal: Signal, timing: 'pre' | 'post' | 'render') {
    return signalTaskQueues.get(signal)?.get(timing);
}

function getTaskQueueForProp(target: Reactive, key: string, timing: 'pre' | 'post' | 'render') {
    return reactivePropsTaskQueues.get(target)?.get(key)?.get(timing)
}



// RENDER CYCLE

const snapshotManager = new SnapshotManager();

let renderCycleCount = -1;

let currentRenderCycle: RenderCycle | undefined;

function endRenderCycle() {
    currentRenderCycle = undefined;
}

class RenderCycle {
    triggeredSignals: Map<Signal, [any, any]> | undefined;
    triggeredReactives: Map<Reactive, Map<string, [any, any]>> | undefined;
    snapshotMap: Map<Reactive, AnyObject> | undefined;

    constructor() {
        renderCycleCount++;
        currentRenderCycle = this;
        queueMicrotask(runNonSyncTasks)
    }

    flagSignal(signal: Signal, newValue: any, oldValue: any) {
        let signals = this.triggeredSignals
        if (!signals) {
            signals = new Map();
            this.triggeredSignals = signals
        }
        signals.set(signal, [newValue, oldValue]);
    }

    flagReactive(target: Reactive, key: string, newValue: any, oldValue: any) {
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

    takeSnapshot(reactive: Reactive) {
        let snapshotMap = this.snapshotMap;
        if (!snapshotMap) {
            snapshotMap = new Map();
            this.snapshotMap = snapshotMap;
        }
        if (snapshotMap.has(reactive)) return; // snapshot of original state already taken for this cycle, no need to take another
        snapshotMap.set(reactive, snapshotManager.takeSnapshot(reactive, renderCycleCount)) // snapshots are shallow clones!
    }
}


export function trigger(target: Signal | Reactive, newValue: any, oldValue: any, key?: string) {
    if (newValue === oldValue) return;
    if (!currentRenderCycle) {
        currentRenderCycle = new RenderCycle();
    }

    // run sync tasks
    const watcher = getCurrentWatcher();
    if (watcher) watcher.stopTracking(); // in case reactive refs are set during an effect
    runEffects(target, newValue, oldValue, 'sync', key);
    if (watcher) watcher.restoreTrackingState();

    // collect triggered refs for this cycle
    if (isSignal(target)) currentRenderCycle.flagSignal(target, newValue, oldValue)
    else currentRenderCycle.flagReactive(target, key!, newValue, oldValue)

    // take snapshot clone if watching reactive object, this will be the old value
    if (reactiveObjTaskQueues.has(target)) {
        currentRenderCycle.takeSnapshot(target);
    }
}

function runEffects(target: Signal | Reactive, newValue: any, oldValue: any, timing: TimeBlock, key?: string) {
    if (isSignal(target)) {
        const flushMap = signalTaskQueues.get(target);
        if (!flushMap) throw "flushMap not found"
        const taskQueue = flushMap.get(timing)
        if (!taskQueue) throw "taskQueue not found"
        for (const handler of taskQueue) {
            handler(newValue, oldValue)
        }
    }
    else {
        if (!key) throw "Cannot track undefined key"
        const propMap = reactivePropsTaskQueues.get(target)
        if (!propMap) throw "propMap not found";
        const flushMap = propMap.get(key)
        if (!flushMap) throw "flushMap not found"
        const taskQueue = flushMap.get(timing);
        if (!taskQueue) throw "taskQueue not found"
        for (const handler of taskQueue) {
            handler(newValue, oldValue)
        }
    }
}

function runNonSyncTasks() {   // TODO: how to prevent render blocking if tasks take too long? Also figure out how to use rAF
    runTasks('pre');
    runTasks('render');
    runTasks('post');
    endRenderCycle();
}

function runTasks(timing: "pre" | "post" | "render") {
    if (!currentRenderCycle) throw "No current render cycle :("
    const triggeredReactives = currentRenderCycle.triggeredReactives;
    if (triggeredReactives) {
        for (const [reactive, keys] of triggeredReactives) {
            if (timing !== 'render') {
                const taskQueue = getTaskQueueForReactive(reactive, timing);
                if (taskQueue) {
                    for (const task of taskQueue) {
                        const snapshotMap = currentRenderCycle.snapshotMap;
                        if (!snapshotMap) throw "no snapshot map :("
                        // TODO: compare snapshot to current object .. are they equal? if so, don't run tasks and get rid of snapshot ... should the diff be deep?
                        task(reactive, snapshotMap.get(reactive))
                    }
                }
            }

            for (const [key, [newValue, oldValue]] of keys) {
                const taskQueue = getTaskQueueForProp(reactive, key, timing);
                if (taskQueue) {
                    for (const task of taskQueue) {
                        task(newValue, oldValue)
                    }
                }
            }
        }
    }

    const triggeredSignals = currentRenderCycle.triggeredSignals;
    if (triggeredSignals) {
        for (const [signal, [newValue, oldValue]] of triggeredSignals) {
            const taskQueue = getTaskQueueForSignal(signal, timing);
            if (taskQueue) {
                for (const task of taskQueue) {
                    task(newValue, oldValue)
                }
            }
        }
    }
}


