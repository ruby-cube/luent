import { useUpdateCycle } from "./effects/UpdateCycle";
import { asWatchTarget, isWatched } from "./effects/watch";
import { asReactiveAtom, isReactiveAtom } from "./derivations/ReactiveAtom";
import { AnyObject } from "@rue/types";
import { MutationRecord } from "./effects/deepWatch";
import { ReactiveModel, toRaw } from "./reactivemodel/Reactive$";
import { AtomicSignal, SignalState } from "./$Signal";
import { ReactiveProp } from "./reactivemodel/ReactiveProp";
import { ReactivePrimitive } from "./ReactivePrimitive";


export function trigger(target: SignalState | ReactiveProp) { //TODO: what happens if key for trackable ops is  undefined or null ? I need to use a UNDEFINED symbol
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



