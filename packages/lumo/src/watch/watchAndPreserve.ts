import { isIon, watchIonicEffect as _watchIonicEffect, afterRender, ReactiveGet, shallowClone, watch as _watch, WatchOptions, IonicModel, OnChangeHandler, Phase, __devCheckIfTracked } from "../../../quarky/src";
import { ActiveListener, ListenerOptions } from "@rue/flask";
import { noop } from "@rue/utils";
import { getActiveDynamicNode, getDynamicNode } from "../dynamic/nodestack";
import { CustomCleanupSchedulerListenerOptions } from "../events/listen";
import { DynamicNode } from "../dynamic/DynamicNode";

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





export function watchIonicEffect(effect: () => void) {
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


// export function watch<T extends () => any | ReactiveGet>(target: T, effect: T extends () => infer R ? OnChangeHandler<R> : never, options?: WatchOptions): ActiveListener
// export function watch<T extends IonicModel>(target: T, effect: MutationEffect<T>, options?: WatchOptions): ActiveListener
// export function watch<T>(target: T, effect: OnChangeHandler<T>, options?: LumoWatchOptions): ActiveListener
// export function watch<T>(target: T, effect: OnChangeHandler<T>, options?: LumoWatchOptions): ActiveListener
export function watch<T>(target: T, effect: OnChangeHandler<T>, options?: LumoWatchOptions): ActiveListener {
    const dynamicNode = getDynamicNode()
    if (!dynamicNode)
        return _watch(target, effect, options)
    return asPreservedWatcher(_watch(target, effect, options), dynamicNode);
}


