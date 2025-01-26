import { isIon, watchEffect as _watchIonicEffect, afterRender, ReactiveGet, shallowClone, watch as _watch, WatchOptions, Ionized, OnChangeHandler, Phase, __devCheckIfTracked } from "../../../quarky/src";
import { ActiveListener, ListenerOptions } from "@rue/flask";
import { CustomCleanupSchedulerListenerOptions } from "../events/listen";
import { DynamicNode, getActiveViewFlask } from "../flask/ViewFlask";
import { AnyObject } from "@rue/types";
import { getTrace } from "./debug";

type WatchForRenderOptions = {
    eager?: true;
    retrack?: boolean;
} & ListenerOptions


type LumoWatchOptions = CustomCleanupSchedulerListenerOptions & Omit<WatchOptions, 'until'>

export function watchRenderEffect(effect: () => void) {
    // const component = getCurrentProvider();
    // if (!component) throw new Error("watchRenderEffect must be called within component setup")

    const dynamicNode = getActiveViewFlask() //TODO: dynamic node or flask?
    if (!dynamicNode)
        return _initializeRender(effect)
    return asPreservedWatcher(_watchIonicEffect(effect, {
        phase: Phase.RENDER,
        until: dynamicNode.onDiscard
    }), dynamicNode)
}

function _initializeRender(effect: () => void) {
    // const _handler = () => {
    //     effect();
    //     // setUpUpdateHooks(component)
    // }
    //TODO: need to make sure handlers are removed onUnmounted.. through a covert flask
}





// export function watchEffect(effect: () => void) {
//     const dynamicNode = getActiveViewFlask() // TODO: dynamic node or flask??
//     if (!dynamicNode)
//         return _watchIonicEffect(effect)
//     return asPreservedWatcher(_watchIonicEffect(effect), dynamicNode);
// }

// function asPreservedWatcher({ pause, resume, stop }: ActiveListener, dynamicNode: DynamicNode) {
//     const deactivationHook = dynamicNode.onDeactivate(pause)
//     const activationHook = dynamicNode.onReactivate(resume)

//     return {
//         stop() {
//             deactivationHook.stop();
//             activationHook.stop();
//             return stop();
//         },
//         pause,
//         resume
//     }
// }

// // T extends () => infer R ? (newValue: R, oldValue: R) => void : (newValue: T, oldValue: T) => void

// type MultiWatchSubjectValues<T> = {[K in keyof T]: T[K] extends (...args: any[])=>infer R ? R : T[K]}

// export function watch<T extends () => any>(target: T, effect: OnChangeHandler<T>, options?: LumoWatchOptions): ActiveListener
// export function watch<T extends Ionized<AnyObject>>(target: T, effect: OnChangeHandler<T>, options?: LumoWatchOptions): ActiveListener
// export function watch<T extends any[]>(target: [...T], effect: OnChangeHandler<T>, options?: LumoWatchOptions): ActiveListener
// export function watch<T>(target: T, effect: OnChangeHandler<T>, options?: LumoWatchOptions): ActiveListener
// // export function watch<T>(target: T, effect: OnChangeHandler<T>, options?: LumoWatchOptions): ActiveListener
// // export function watch<T>(target: T, effect: OnChangeHandler<T>, options?: LumoWatchOptions): ActiveListener
// export function watch<T>(target: T, effect: OnChangeHandler<T>, options?: LumoWatchOptions): ActiveListener {
//    // console.log(getTrace()) 
//    const dynamicNode = getActiveViewFlask() //TODO: dynamic node or flask?
//     if (!dynamicNode)
//         return _watch(target, effect, options)
//     return asPreservedWatcher(_watch(target, effect, options), dynamicNode);
// }


