import { isAnyIon, watchIonicEffect as _initializeIonicEffect, afterRender, ReactiveGet, shallowClone, watch as _watch, WatchOptions, IonicModel, ChangeEffect, Phase, __devCheckIfTracked } from "../../../quarky/src";
import { InternalComponent } from "../component/InternalComponent";
import { AnyObject } from "@rue/types";
import { isMountPhase } from "../dynamic/DynamicNode";
import { ActiveListener, ListenerOptions } from "@rue/flask";
import { onActivated, onDeactivate } from "../dynamic/lifecycle";
import { noop } from "@rue/utils";
import { getCurrentProvider, getProviderComponent, popProvider, pushProvider } from "../component/provide";
import { getActiveDynamicNode } from "../dynamic/nodestack";
import { CustomCleanupSchedulerListenerOptions } from "../events/listen";

type WatchForRenderOptions = {
    eager?: true;
    retrack?: boolean;
} & ListenerOptions


type LumoWatchOptions =  CustomCleanupSchedulerListenerOptions & Omit<WatchOptions, 'until'>

export function initializeRender(effect: () => void) {
    const component = getCurrentProvider();
    if (!component) throw new Error("initializeRender must be called within component setup")

    const dynamicNode = getActiveDynamicNode()
    if (dynamicNode.preserve)
        return _initializeAndPreserve(effect, true)

    return _initializeRender(effect)
}

function _initializeRender(effect: () => void) {
    // const _handler = () => {
    //     effect();
    //     // setUpUpdateHooks(component)
    // }
    return _initializeIonicEffect(effect, {
        phase: Phase.RENDER,
    }) //TODO: need to make sure handlers are removed onUnmounted.. through a covert flask
}

// type Effect<T = any> = MutationEffect<T extends AnyObject ? T : never> | ChangeEffect<T>


// export function watchForRender<T extends () => any | ReactiveGet>(target: T, effect: T extends () => infer R ? ChangeEffect<R> : never, options?: WatchForRenderOptions): ActiveListener
// export function watchForRender<T extends IonicModel>(target: T, effect: MutationEffect<T>, options?: WatchForRenderOptions): ActiveListener
// export function watchForRender<T extends () => any | ReactiveGet | IonicModel>(target: T, effect: T extends () => infer R ? ChangeEffect<R> : MutationEffect<T>, options?: WatchForRenderOptions): ActiveListener {
//     // const component = getCurrentComponent<InternalComponent>();
//     // if (!component) throw Error("watchForRender must be called within component setup")

//     const dynamicNode = getActiveDynamicNode()
//     if (!dynamicNode) throw new Error(`No dynamic node found. This should never happen after root component is set up since the root component is a dynamic node`)


//     if (dynamicNode.preserve)
//         return watchAndPreserve(target, effect, { phase: Phase.RENDER, ...options || {} })

//     return _watchForRender(target, effect, options)
// }

// export function _watchForRender(target: () => any | ReactiveGet | IonicModel, effect: Effect, options?: WatchForRenderOptions) {
//     // const component = getCurrentComponent<InternalComponent>()!;
//     // const _handler = (newValue: any, oldValue: any) => {
//     // handler(newValue, oldValue);
//     // setUpUpdateHooks(component)
//     // }
//     return _watch(target, effect, { phase: Phase.RENDER, ...options || {} }) //TODO: need to make sure handlers are removed onUnmounted.. through a covert flask
// }

// export function setUpUpdateHooks(component: InternalComponent) {
//     if (component.hasUpdates === true) return;
//     component.hasUpdates = true; // makes sure component.emit() runs only once per cycle even if many changes happen

//     // beforeRender(() => { //NOTE: This causes a memory leak because the listener is registered AFTER beforeRender is emitted. Before update needs to be emitted elsewhere.
//     //     console.log("beforeRender cb: emit before update")
//     //     component.emit(LifecycleHook.BEFORE_UPDATE)
//     // }, { once: true })

//     afterRender(() => {
//         component.emit(LifecycleHook.ON_UPDATED) //NOTE: I don't know if I even need an after update hook...
//         component.hasUpdates = false; // resets for the next cycle
//     }, { __devName: setUpUpdateHooks.name })
// }

function bindWithComponent(fn: Function, component: InternalComponent) {
    return (...args: any[]) => {
        pushProvider(component)
        const output = fn(...args)
        popProvider()
        return output;
    }
}

function _initializeAndPreserve(effect: () => void, renderPhase?: true): ActiveListener {
    const mountPhase = isMountPhase()
    const component = getProviderComponent()
    const initializeFn = bindWithComponent(renderPhase ? _initializeRender : _initializeIonicEffect, component);
    const dynamicNode = getActiveDynamicNode()!
    const watcher = { stop: noop }

    onActivated(() => {
        watcher.stop = initializeFn(effect).stop
    }, { once: true }, dynamicNode)

    onDeactivate(deactivateAndReactivate, { once: true }, dynamicNode)

    function deactivateAndReactivate() {
        watcher.stop()
        if (!mountPhase) {
            onActivated(() => {
                watcher.stop = initializeFn(effect).stop
                onDeactivate(deactivateAndReactivate, { once: true }, dynamicNode)
            }, { once: true }, dynamicNode)
        }
    }

    return watcher;
}

export function watchIonicEffect(effect: () => void) {
    const dynamicNode = getActiveDynamicNode()

    if (dynamicNode.preserve)
        return _initializeAndPreserve(effect)
    return _initializeIonicEffect(effect)
}


// export function watch<T extends () => any | ReactiveGet>(target: T, effect: T extends () => infer R ? ChangeEffect<R> : never, options?: WatchOptions): ActiveListener
// export function watch<T extends IonicModel>(target: T, effect: MutationEffect<T>, options?: WatchOptions): ActiveListener
export function watch<T>(target: T & (() => any), effect: ChangeEffect<T>, options?: LumoWatchOptions): ActiveListener
export function watch<T>(target: T & AnyObject, effect: ChangeEffect<T>, options?: LumoWatchOptions): ActiveListener
export function watch<T extends () => any | ReactiveGet | AnyObject>(target: T, effect: ChangeEffect<T>, options?: LumoWatchOptions): ActiveListener {
    // const dynamicNode = getActiveDynamicNode()

    // if (dynamicNode && dynamicNode.preserve)
        // return watchAndPreserve(target, effect, options)
    return _watch(target, effect, options)
}

function watchAndPreserve<T extends () => any | ReactiveGet | AnyObject>(target: T, effect: ChangeEffect<T>, options?: LumoWatchOptions) {
    const mountPhase = isMountPhase()
    // const component = getProviderComponent(watchAndPreserve.name);
    // const watchFn = options?.phase === Phase.RENDER ? _watchForRender : _watch
    const dynamicNode = getActiveDynamicNode()!

    const watcher = { stop: noop }
    let reactivation = false; //FIX: I'm not sure if this is helping with reactivation
    let oldValue: any
    // initializeOnActivated()
    onDeactivate(deactivateAndReactivate, { once: true }, dynamicNode)

    function deactivateAndReactivate() {
        if (__DEV__) __devCheckIfTracked()
        oldValue = isAnyIon(target) ? target() : shallowClone(target)
        reactivation = true;
        watcher.stop()
        if (!mountPhase) {
            // initializeOnActivated()
        }
    }

    //FIX: Needs major fixing, temporarily commented out to quiet ts
    // function initializeOnActivated() {
    //     if (isAnyIon(target)) {
    //         onActivated(() => {
    //             if (reactivation) effect(target(), oldValue)
    //             initializeWatcher()
    //         }, { once: true }, dynamicNode)
    //     }
    //     else {
    //         onActivated(() => {
    //             if (reactivation) effect(<IonicModel<T extends AnyObject ? T : never>>target, oldValue)
    //             initializeWatcher()
    //         }, { once: true }, dynamicNode)
    //     }
    // }

    // function initializeWatcher() {
    //     // pushProvider(component)
    //     watcher.stop = watchFn(target, effect, options).stop
    //     // popProvider()
    // }

    return watcher
}

// export function watchForRender<T>(target: ReactiveGet<T> | IonicModel<T extends AnyObject ? T : never>, handler: (newValue: T, oldValue: T) => void, options?: { once?: true }) {
//     const component = getCurrentComponent();
//     if (!component || component === "root") throw Error("watchForRender must be called within component setup")

//     // collect tracked refs and get taskQueues
//     const deps = getDependencies(target)
//     const taskQueues = usePhaseQueues(deps, 'update')

//     if (target instanceof Function || isReactiveEffect) {
//         const dependencies = getDependencies(target || handler, isReactiveEffect)
//         taskQueues = usePhaseQueues(dependencies, phase, deep);
//     }
//     else {
//         // watch all properties of reactive
//         taskQueues = usePhaseQueuesForReactive(target, phase, deep)
//     }

//     const _handler = (newValue: any, oldValue: any) => {
//         handler(newValue, oldValue);
//         if (component.hasUpdates === true) return;
//         component.hasUpdates = true; // makes sure component.emit() runs only once per cycle even if many changes happen

//         beforeRender(() => {
//             component.emit(LifecycleHook.BEFORE_UPDATE)
//         }, { once: true }) // assuming cleanup flask is set up

//         afterRender(() => {
//             component.emit(LifecycleHook.ON_UPDATED)
//             component.hasUpdates = false; // resets for the next cycle
//         }, { once: true })
//     }

//     // set up listeners
//     for (const taskQueue of taskQueues) {
//         $listen(_handler, { until: onUnmounted, ...options }, {
//             enroll(task) {
//                 taskQueue.add(task)
//             },
//             remove(task) {
//                 taskQueue.delete(task)
//             }
//         });
//     }
// }

