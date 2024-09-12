import { asReactiveAtom, isReactiveAtom, ReactivePrimitive } from "./derivations/ReactiveAtom";
import { ReactiveModel, toRaw } from "./reactivemodel/Reactive$";
import { AtomicSignal, MetaSignal } from "./$Signal";
import { ObservedProp } from "./reactivemodel/ObservedProp";
import { asWatchTarget, isWatched } from "./effects/WatchTarget";


export function trigger(target: AtomicSignal | ObservedProp) { //TODO: what happens if key for trackable ops is  undefined or null ? I need to use a UNDEFINED symbol
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

export function triggerReactiveModel(reactive: ReactiveModel) {
   
    asWatchTarget(reactive).triggerEffects()
}



