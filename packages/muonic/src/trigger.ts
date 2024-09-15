import { asReactiveAtom, isReactiveAtom, ReactivePrimitive } from "./derivations/ReactiveAtom";
import { getMetaReactive, ReactiveModel, toRaw } from "./reactivemodel/ReactiveModel";
import { AtomicSignal, MetaSignal } from "./Signal";
import { ObservedProp, toPropSignal } from "./reactivemodel/ObservedProp";
import { asWatchTarget, isWatched } from "./effects/WatchTarget";


export function trigger(target: AtomicSignal | ObservedProp) {
    const propSignal = toPropSignal(target)

    if (propSignal && isWatched(target)){
        asWatchTarget(propSignal).triggerEffects()
    }

    if (isWatched(target)) {
        asWatchTarget(target).triggerEffects()
    }
    triggerReactiveAtom(target)
}

export function triggerReactiveAtom(target: ReactivePrimitive) {
    if (isReactiveAtom(target)) {
        asReactiveAtom(target).triggerDerivations()
    }
}

export function triggerReactiveModel(reactive: ReactiveModel) {
    asWatchTarget(getMetaReactive(reactive)).triggerEffects()
}
