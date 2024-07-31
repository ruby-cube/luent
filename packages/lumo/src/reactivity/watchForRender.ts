import { _watchEffect, getDependencies, useTaskQueues } from "@rue/muonic/watch";
import { getCurrentComponent, InternalComponent } from "../component/component";
import { beforeUpdatePhase, onUpdateComplete } from "@rue/muonic/UpdateCycle";
import { ReactiveSignal } from "@rue/muonic/useDerivedSignal";
import { ReactiveObject } from "@rue/muonic/useReactiveObjects";
import { AnyObject } from "@rue/types";
import { LifecycleHook } from "../component/lifecycle";


export function watchRenderEffect(effect: () => void) {
    const component = getCurrentComponent();
    if (!component) throw Error("watchRenderEffect must be called within component setup")

    const _handler = () => {
        effect();
        setUpUpdateHooks(component)
    }
    return _watchEffect(_handler, undefined, {
        phase: 'render'
    }) //TODO: need to make sure handlers are removed onUnmounted.. through a covert flask
}

export function watchForRender<T>(target: ReactiveSignal<T> | ReactiveObject<T extends AnyObject ? T : never>, handler: (newValue: T, oldValue: T) => void, options?: { once?: true, eager?: true }) {
    const component = getCurrentComponent();
    if (!component) throw Error("watchForRender must be called within component setup")

    const _handler = (newValue: any, oldValue: any) => {
        handler(newValue, oldValue);
        setUpUpdateHooks(component)
    }
    return _watchEffect(_handler, target, {
        once: options?.once,
        eager: options?.eager,
        phase: 'render',
    }) //TODO: need to make sure handlers are removed onUnmounted.. through a covert flask
}

function setUpUpdateHooks(component: InternalComponent) {
    if (component.hasUpdates === true) return;
    component.hasUpdates = true; // makes sure component.emit() runs only once per cycle even if many changes happen

    beforeUpdatePhase(() => {
        component.emit(LifecycleHook.BEFORE_UPDATE)
    }, { once: true }) // assuming cleanup flask is set up

    onUpdateComplete(() => {
        component.emit(LifecycleHook.UPDATED)
        component.hasUpdates = false; // resets for the next cycle
    }, { once: true })
}



// export function watchForRender<T>(target: ReactiveSignal<T> | ReactiveObject<T extends AnyObject ? T : never>, handler: (newValue: T, oldValue: T) => void, options?: { once?: true }) {
//     const component = getCurrentComponent();
//     if (!component || component === "root") throw Error("watchForRender must be called within component setup")

//     // collect tracked refs and get taskQueues
//     const deps = getDependencies(target)
//     const taskQueues = useTaskQueues(deps, 'update')

//     if (target instanceof Function || isReactiveEffect) {
//         const dependencies = getDependencies(target || handler, isReactiveEffect)
//         taskQueues = useTaskQueues(dependencies, phase, deep);
//     }
//     else {
//         // watch all properties of reactive
//         taskQueues = useTaskQueuesForReactive(target, phase, deep)
//     }

//     const _handler = (newValue: any, oldValue: any) => {
//         handler(newValue, oldValue);
//         if (component.hasUpdates === true) return;
//         component.hasUpdates = true; // makes sure component.emit() runs only once per cycle even if many changes happen

//         beforeUpdatePhase(() => {
//             component.emit(LifecycleHook.BEFORE_UPDATE)
//         }, { once: true }) // assuming cleanup flask is set up

//         onUpdateComplete(() => {
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

