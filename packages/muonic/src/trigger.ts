import { asReactiveAtom, isReactiveAtom, ReactivePrimitive } from "./derivations/ReactiveAtom";
import { getMetaReactive, ReactiveModel, toRaw } from "./ionic/ReactiveModel";
import { AtomicIon, MetaIon } from "./Ion";
import { ObservedProp, toPropIon } from "./ionic/ObservedProp";
import { asWatchTarget, isWatched } from "./effects/WatchTarget";
import { getCurrentRenderCycle } from "./effects/RenderCycle";
import { getWithoutTracking } from "./derivations/DependencyTracker";


export function trigger(target: AtomicIon | ObservedProp) {
    if (__DEV__ && getCurrentRenderCycle() && getCurrentRenderCycle()!.phase > 1) 
        console.warn(`CASE RESEARCH: Reactive entity triggered during phase ${getCurrentRenderCycle()!.phase}:`, target, getWithoutTracking(target))
    const propPod = toPropIon(target)

    if (propPod && isWatched(target)) {
        asWatchTarget(propPod).triggerEffects()
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
