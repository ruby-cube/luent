import { beforeRender, ChangeHandler, getDependencies, initializeEffect, onRendered, ReactiveSignal, usePhaseQueues, watch } from "@rue/muonic";
import { InternalComponent } from "../component/InternalComponent";
import { AnyObject } from "@rue/types";
import { LifecycleHook } from "../component/lifecycle";
import { getWithoutTracking, ReactiveModel } from "@rue/muonic";
import { getCurrentComponent } from "../component/componentStack";


export function initializeRender(effect: () => void) {
    const component = getCurrentComponent<InternalComponent>();
    if (!component) throw Error("initializeRender must be called within component setup")

    const _handler = () => {
        effect();
        setUpUpdateHooks(component)
    }
    return initializeEffect(_handler, {
        phase: 'render'
    }) //TODO: need to make sure handlers are removed onUnmounted.. through a covert flask
}

export function watchForRender<T>(target: ReactiveSignal<T> | ReactiveModel<T extends AnyObject ? T : never>, handler: ChangeHandler<T>, options?: { once?: true, eager?: true }) {
    const component = getCurrentComponent<InternalComponent>();
    if (!component) throw Error("watchForRender must be called within component setup")


    const _handler = (newValue: any, oldValue: any) => {
        handler(newValue, oldValue);
        setUpUpdateHooks(component)
    }
    return watch(target, _handler, {
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
        component.emit(LifecycleHook.UPDATED)
        component.hasUpdates = false; // resets for the next cycle
    }, { once: true })
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
//             component.emit(LifecycleHook.UPDATED)
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

