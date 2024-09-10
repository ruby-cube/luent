import { useUpdateCycle } from "./effects/UpdateCycle";
import { asReactiveAtom, isReactiveAtom } from "./derivations/ReactiveAtom";
import { AnyObject } from "@rue/types";
import { MutationRecord } from "./effects/deepWatch";
import { toRaw } from "./reactivemodel/Reactive$";
import { AtomicSignal, SignalState } from "./$Signal";
import { ObservedProp } from "./reactivemodel/ObservedProp";
import { ReactivePrimitive } from "./ReactivePrimitive";
import { MetaReactiveModel, ReactiveModel } from "./reactivemodel/ReactiveModel";
import { asWatchTarget, isWatched } from "./effects/WatchTarget";


export function trigger(target: SignalState | ObservedProp) { //TODO: what happens if key for trackable ops is  undefined or null ? I need to use a UNDEFINED symbol
    if (isWatched(target)) {
        asWatchTarget(target).triggerEffects()
    }
    triggerReactiveAtom(target)
}

export function triggerReactiveAtom(target: ReactivePrimitive) { //TODO: what happens if key for trackable ops is  undefined or null ? I need to use a UNDEFINED symbol
    if (isReactiveAtom(target)) {
        asReactiveAtom(target).triggerDerivations()
    }
}

export function triggerReactiveModel(metaReactive: MetaReactiveModel) {
    asWatchTarget(metaReactive).triggerEffects()
}



