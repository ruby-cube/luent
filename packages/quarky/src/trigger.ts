import { asIonicAtom, isIonicAtom, ReactivePrimitive } from "./derivations/IonicAtom";
import { getMetaReactive, IonicModel, toRaw } from "./ionize/IonicModel";
import { AtomicIon, MetaIon } from "./ion/AtomicIon";
import { ObservedProp, toPropIon } from "./ionize/ObservedProp";
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
    triggerIonicAtom(target)
}

export function triggerIonicAtom(target: ReactivePrimitive) {
    if (isIonicAtom(target)) {
        asIonicAtom(target).triggerDerivations()
    }
}

export function triggerIonicModel(reactive: IonicModel) {
    asWatchTarget(getMetaReactive(reactive)).triggerEffects()
}
