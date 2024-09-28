import { asIonicAtom, isIonicAtom, ReactivePrimitive } from "./derivations/IonicAtom";
import { asMetaIonicModel, IonicModel, toRaw } from "./ionize/IonicModel";
import { ReactiveIon, MetaIon } from "./ion/ReactiveIon";
import { ObservedProp, toPropIon } from "./ionize/ObservedProp";
import { asWatchTarget, isWatched } from "./effects/WatchTarget";
import { getCurrentRenderCycle } from "./effects/RenderCycle";
import { getWithoutTracking } from "./derivations/DependencyTracker";
import { isIonicEffectAtom } from "./derivations/IonicEffect";
import { isCurrentWatchTarget } from "./effects/watch";


export function trigger(target: ReactiveIon | ObservedProp, newValue?: any, oldValue?: any) {
    if (__DEV__ && getCurrentRenderCycle() && getCurrentRenderCycle()!.phase > 1)
        console.warn(`CASE RESEARCH: Reactive entity triggered during phase ${getCurrentRenderCycle()!.phase}:`, target, getWithoutTracking(target))

    // prevent infinite loops for synchronous effects
    if (isIonicEffectAtom(target) || isCurrentWatchTarget(target))
        return;

    const propPod = toPropIon(target)

    if (propPod && isWatched(target)) {
        asWatchTarget(propPod).triggerEffects()
    }

    if (isWatched(target)) {
        asWatchTarget(target).triggerEffects()
    }
    triggerIonicAtom(target, newValue, oldValue)
}

export function triggerIonicAtom(target: ReactivePrimitive, newValue?: any, oldValue?: any) {
    if (isIonicAtom(target)) {
        asIonicAtom(target).triggerDerivations(newValue, oldValue)
    }
}

export function triggerIonicModel(reactive: IonicModel) {
    asWatchTarget(reactive).triggerEffects()
}
