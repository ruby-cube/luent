import { isIon, watchEffect as _watchIonicEffect, afterRender, ReactiveGet, shallowClone, watch as _watch, WatchOptions, Ionized, OnChangeHandler, Phase, __devCheckIfTracked } from "../../../quarky/src";
import { ActiveListener, ListenerOptions } from "@rue/flask";
import { getActiveDynamicNode, getDynamicNode } from "../dynamic/nodestack";
import { CustomCleanupSchedulerListenerOptions } from "../events/listen";
import { DynamicNode } from "../dynamic/DynamicNode";
import { AnyObject } from "@rue/types";

type WatchForRenderOptions = {
    eager?: true;
    retrack?: boolean;
} & ListenerOptions


type LumoWatchOptions = CustomCleanupSchedulerListenerOptions & Omit<WatchOptions, 'until'>

export function initializeRender(effect: () => void) {
    // const component = getCurrentProvider();
    // if (!component) throw new Error("initializeRender must be called within component setup")

    const dynamicNode = getDynamicNode()
    if (!dynamicNode)
        return _initializeRender(effect)
    return asPreservedWatcher(_watchIonicEffect(effect, {
        phase: Phase.RENDER,
        until: dynamicNode.onDestroy
    }), dynamicNode)
}

function _initializeRender(effect: () => void) {
    // const _handler = () => {
    //     effect();
    //     // setUpUpdateHooks(component)
    // }
    //TODO: need to make sure handlers are removed onUnmounted.. through a covert flask
}





export function watchEffect(effect: () => void) {
    const dynamicNode = getDynamicNode()
    if (!dynamicNode)
        return _watchIonicEffect(effect)
    return asPreservedWatcher(_watchIonicEffect(effect), dynamicNode);
}

function asPreservedWatcher({ pause, resume, stop }: ActiveListener, dynamicNode: DynamicNode) {
    const deactivationHook = dynamicNode.onDeactivate(pause)
    const activationHook = dynamicNode.onReactivate(resume)

    return {
        stop() {
            deactivationHook.stop();
            activationHook.stop();
            return stop();
        },
        pause,
        resume
    }
}

// T extends () => infer R ? (newValue: R, oldValue: R) => void : (newValue: T, oldValue: T) => void

type MultiWatchSubjectValues<T> = {[K in keyof T]: T[K] extends (...args: any[])=>infer R ? R : T[K]}

export function watch<T extends () => any>(target: T, effect: T extends () => infer R ? (newValue: R, oldValue: R) => void : never, options?: LumoWatchOptions): ActiveListener
export function watch<T extends Ionized<AnyObject>>(target: T, effect: (newValue: T, oldValue: T)=>void, options?: LumoWatchOptions): ActiveListener
export function watch<T extends any[]>(target: [...T], effect: (newValue: MultiWatchSubjectValues<T>, oldValue: MultiWatchSubjectValues<T>)=>void, options?: LumoWatchOptions): ActiveListener
export function watch<T>(target: T, effect: (newValue: T, oldValue: T)=>void, options?: LumoWatchOptions): ActiveListener
// export function watch<T>(target: T, effect: OnChangeHandler<T>, options?: LumoWatchOptions): ActiveListener
// export function watch<T>(target: T, effect: OnChangeHandler<T>, options?: LumoWatchOptions): ActiveListener
export function watch<T>(target: T, effect: T extends () => infer R ? (newValue: R, oldValue: R) => void : (newValue: T, oldValue: T)=>void, options?: LumoWatchOptions): ActiveListener {
    const dynamicNode = getDynamicNode()
    if (!dynamicNode)
        return _watch(target, effect, options)
    return asPreservedWatcher(_watch(target, effect, options), dynamicNode);
}


