import { beforeRender, ChangeHandler, isSignal, $initializeEffect as _$initializeEffect, onRendered, ReactiveSignal, shallowClone, watch as _watch, WatchOptions } from "@rue/muonic";
import { getComponent, InternalComponent } from "../component/InternalComponent";
import { AnyObject } from "@rue/types";
import { LifecycleHook } from "../component/lifecycle";
import { getCurrentComponent, popComponent, pushComponent } from "../component/componentStack";
import { DynamicNode, getActiveDynamicNode, isMountPhase } from "../dynamic/DynamicNode";
import { ActiveListener, ListenerOptions } from "@rue/flask";
import { onActivated, onDeactivate, onDestroy } from "../dynamic/lifecycle";
import { noop } from "@rue/utils";
import { ReactiveModel } from "../../../muonic/src/reactivemodel/ReactiveModel";

type WatchForRenderOptions = {
    deep?: boolean;
    eager?: true;
    retrack?: boolean;
} & ListenerOptions


export function initializeRender(effect: () => void) {
    const component = getCurrentComponent<InternalComponent>();
    if (!component) throw new Error("initializeRender must be called within component setup")

    const dynamicNode = getActiveDynamicNode()
    if (!dynamicNode) throw new Error(`No dynamic node found. This should never happen after root component is set up since the root component is a dynamic node`)
    if (dynamicNode.preserve)
        return _initializeAndPreserve(effect, true)

    return _initializeRender(effect)
}

function _initializeRender(effect: () => void) {
    const component = getCurrentComponent<InternalComponent>()!;
    const _handler = () => {
        effect();
        setUpUpdateHooks(component)
    }
    return _$initializeEffect(_handler, {
        phase: 'render',
    }) //TODO: need to make sure handlers are removed onUnmounted.. through a covert flask
}

export function watchForRender<T>(target: () => any | ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, handler: ChangeHandler<T>, options?: WatchForRenderOptions) {
    // const component = getCurrentComponent<InternalComponent>();
    // if (!component) throw Error("watchForRender must be called within component setup")

    const dynamicNode = getActiveDynamicNode()
    if (!dynamicNode) throw new Error(`No dynamic node found. This should never happen after root component is set up since the root component is a dynamic node`)


    if (dynamicNode.preserve)
        return watchAndPreserve(target, handler, { phase: 'render', ...options || {} })

    return _watchForRender(target, handler, options)
}

function _watchForRender<T>(target: () => any | ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, handler: ChangeHandler<T>, options?: WatchForRenderOptions) {
    // const component = getCurrentComponent<InternalComponent>()!;
    // const _handler = (newValue: any, oldValue: any) => {
    // handler(newValue, oldValue);
    // setUpUpdateHooks(component)
    // }
    return _watch(target, handler, { phase: 'render', ...options || {} }) //TODO: need to make sure handlers are removed onUnmounted.. through a covert flask
}

export function setUpUpdateHooks(component: InternalComponent) {
    if (component.hasUpdates === true) return;
    component.hasUpdates = true; // makes sure component.emit() runs only once per cycle even if many changes happen

    // beforeRender(() => { //NOTE: This causes a memory leak because the listener is registered AFTER beforeRender is emitted. Before update needs to be emitted elsewhere.
    //     console.log("beforeRender cb: emit before update")
    //     component.emit(LifecycleHook.BEFORE_UPDATE)
    // }, { once: true })

    onRendered(() => {
        component.emit(LifecycleHook.ON_UPDATED) //NOTE: I don't know if I even need an after update hook...
        component.hasUpdates = false; // resets for the next cycle
    }, { __devName: setUpUpdateHooks.name })
}

function bindWithComponent(fn: Function, component: InternalComponent) {
    return (...args: any[]) => {
        pushComponent(component)
        const output = fn(...args)
        popComponent()
        return output;
    }
}

function _initializeAndPreserve(effect: () => void, renderPhase?: true): ActiveListener {
    const mountPhase = isMountPhase()
    const component = getComponent(_initializeAndPreserve.name)
    const initializeFn = bindWithComponent(renderPhase ? _initializeRender : _$initializeEffect, component);
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

export function $initializeEffect(effect: () => void) {
    const dynamicNode = getActiveDynamicNode()
    if (!dynamicNode) throw new Error(`No dynamic node found. This should never happen after root component is set up since the root component is a dynamic node`)

    if (dynamicNode.preserve)
        return _initializeAndPreserve(effect)
    return _$initializeEffect(effect)
}

export function watch<T>(target: () => any | ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, handler: ChangeHandler<T>, options?: WatchOptions) {
    const dynamicNode = getActiveDynamicNode()
    if (!dynamicNode) throw new Error(`No dynamic node found. This should never happen after root component is set up since the root component is a dynamic node`)

    if (dynamicNode.preserve)
        return watchAndPreserve(target, handler, options)
    return _watch(target, handler, options)
}

function watchAndPreserve<T>(target: () => any | ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, handler: ChangeHandler<T>, options?: WatchOptions) {
    const mountPhase = isMountPhase()
    // const component = getComponent(watchAndPreserve.name);
    const watchFn = options?.phase === 'render' ? _watchForRender : _watch
    const dynamicNode = getActiveDynamicNode()!

    const watcher = { stop: noop }
    let reactivation = false; //FIX: I'm not sure if this is helping with reactivation
    let oldValue: any
    initializeOnActivated()
    onDeactivate(deactivateAndReactivate, { once: true }, dynamicNode)

    function deactivateAndReactivate() {
        oldValue = isSignal(target) ? target() : shallowClone(target)
        reactivation = true;
        watcher.stop()
        if (!mountPhase) {
            initializeOnActivated()
        }
    }

    function initializeOnActivated() {
        if (isSignal(target)) {
            onActivated(() => {
                if (reactivation) handler(target(), oldValue)
                initializeWatcher()
            }, { once: true }, dynamicNode)
        }
        else {
            onActivated(() => {
                if (reactivation) handler(<ReactiveModel<T extends AnyObject ? T : never>>target, oldValue)
                initializeWatcher()
            }, { once: true }, dynamicNode)
        }
    }

    function initializeWatcher() {
        // pushComponent(component)
        watcher.stop = watchFn(target, handler, options).stop
        // popComponent()
    }

    return watcher
}

// export function watchForRender<T>(target: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, handler: (newValue: T, oldValue: T) => void, options?: { once?: true }) {
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

//         onRendered(() => {
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

