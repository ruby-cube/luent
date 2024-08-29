import { beforeRender, ChangeHandler, getDependencies, hasSignal, initializeEffect as _initializeEffect, onRendered, ReactiveSignal, shallowClone, usePhaseQueues, watch as _watch, WatchOptions } from "@rue/muonic";
import { InternalComponent } from "../component/InternalComponent";
import { AnyObject } from "@rue/types";
import { LifecycleHook } from "../component/lifecycle";
import { getWithoutTracking, ReactiveModel } from "@rue/muonic";
import { getCurrentComponent, popComponent, pushComponent } from "../component/componentStack";
import { getActiveDynamicNode } from "../dynamic/DynamicNode";
import { ActiveListener } from "@rue/flask";
import { onActivated, onDeactivate, onDestroy } from "../dynamic/lifecycle";


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
    return _initializeEffect(_handler, {
        phase: 'render'
    }) //TODO: need to make sure handlers are removed onUnmounted.. through a covert flask
}

export function watchForRender<T>(target: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, handler: ChangeHandler<T>, options?: { once?: true, eager?: true }) {
    const component = getCurrentComponent<InternalComponent>();
    if (!component) throw Error("watchForRender must be called within component setup")

    const dynamicNode = getActiveDynamicNode()
    if (!dynamicNode) throw new Error(`No dynamic node found. This should never happen after root component is set up since the root component is a dynamic node`)

    if (dynamicNode.preserve)
        return watchAndPreserve(target, handler, { phase: 'render', ...options || {} })

    return _watchForRender(target, handler, options)
}

function _watchForRender<T>(target: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, handler: ChangeHandler<T>, options?: { once?: true, eager?: true }) {
    const component = getCurrentComponent<InternalComponent>()!;
    const _handler = (newValue: any, oldValue: any) => {
        handler(newValue, oldValue);
        setUpUpdateHooks(component)
    }
    return _watch(target, _handler, {
        once: options?.once,
        eager: options?.eager,
        phase: 'render',
    }) //TODO: need to make sure handlers are removed onUnmounted.. through a covert flask
}

function setUpUpdateHooks(component: InternalComponent) {
    if (component.hasUpdates === true) return;
    component.hasUpdates = true; // makes sure component.emit() runs only once per cycle even if many changes happen

    beforeRender(() => {
        component.emit(LifecycleHook.BEFORE_UPDATE)
    }, { once: true }) // assuming cleanup flask is set up

    onRendered(() => {
        component.emit(LifecycleHook.AFTER_UPDATE)
        component.hasUpdates = false; // resets for the next cycle
    }, { once: true })
}



function _initializeAndPreserve(effect: () => void, renderPhase?: true): ActiveListener {
    const initializeFn = renderPhase ? _initializeRender : _initializeEffect;
    const watcher = { stop: () => { } }

    onActivated(() => {
        watcher.stop = initializeFn(effect).stop
    }, { until: onDestroy, flask: 'outlive' })

    onDeactivate(() => {
        watcher.stop()
    }, { until: onDestroy, flask: 'outlive' })

    return watcher;
}

export function initializeEffect(effect: () => void) {
    const dynamicNode = getActiveDynamicNode()
    if (!dynamicNode) throw new Error(`No dynamic node found. This should never happen after root component is set up since the root component is a dynamic node`)

    if (dynamicNode.preserve)
        return _initializeAndPreserve(effect)
    return _initializeEffect(effect)
}

export function watch<T>(target: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, handler: ChangeHandler<T>, options?: WatchOptions) {
    const dynamicNode = getActiveDynamicNode()
    if (!dynamicNode) throw new Error(`No dynamic node found. This should never happen after root component is set up since the root component is a dynamic node`)

    if (dynamicNode.preserve)
        return watchAndPreserve(target, handler, options)
    return _watch(target, handler, options)
}

function watchAndPreserve<T>(target: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, handler: ChangeHandler<T>, options?: WatchOptions) {
    const component = getCurrentComponent();
    if (!component) throw new Error("No component found")
    const watchFn = options?.phase === 'render' ? _watchForRender : _watch

    const watcher = { stop: () => { } }
    const oldValue = hasSignal(target) ? target() : shallowClone(target)
    if (hasSignal(target)) {
        onActivated(() => {
            handler(target(), oldValue) //FIX: Why am I calling this here? what about snapshots?
            pushComponent(component)
            watcher.stop = watchFn(target, handler, options).stop
            popComponent()
        }, { until: onDestroy, flask: 'outlive' })
    }
    else {
        onActivated(() => {
            handler(target, oldValue)
            pushComponent(component)
            watcher.stop = watchFn(target, handler, options).stop
            popComponent()
        }, { until: onDestroy, flask: 'outlive' })
    }
    onDeactivate(() => {
        watcher.stop()
    }, { until: onDestroy, flask: 'outlive' })
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
//             component.emit(LifecycleHook.AFTER_UPDATE)
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

