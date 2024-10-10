import { asIonicAtom, isIonicAtom, ReactivePrimitive } from "./derivations/IonicAtom";
import { asMetaIonicModel, IonicModel, toRaw } from "./ionize/IonicModel";
import { Ion, MetaIon } from "./ion/Ion";
import { asWatchSubject, isWatched } from "./effects/WatchSubject";
import { getCurrentRenderCycle } from "./effects/RenderCycle";
import { getWithoutTracking } from "./derivations/DependencyTracker";
import { isIonicEffectAtom } from "./derivations/IonicEffect";
import { isCurrentWatchSubject } from "./effects/watch";
import { PropIon } from "./ionize/PropIon";


export function trigger(target: Ion | PropIon, newValue?: any, oldValue?: any) {
    if (__DEV__ && getCurrentRenderCycle() && getCurrentRenderCycle()!.phase > 1)
        console.warn(`CASE RESEARCH: Reactive entity triggered during phase ${getCurrentRenderCycle()!.phase}:`, target, getWithoutTracking(target))

    // prevent infinite loops for synchronous effects
    if (isIonicEffectAtom(target) || isCurrentWatchSubject(target))
        return;

    // const propPod = toPropIon(target)

    // if (propPod && isWatched(target)) {
    //     asWatchSubject(propPod).triggerEffects()
    // }

    if (isWatched(target)) {
        asWatchSubject(target).triggerEffects()
    }
    triggerIonicAtom(target, newValue, oldValue)
}

export function triggerIonicAtom(target: ReactivePrimitive, newValue?: any, oldValue?: any) {
    if (isIonicAtom(target)) {
        asIonicAtom(target).triggerDerivations(newValue, oldValue)
    }
}

export function triggerIonicModel(reactive: IonicModel) {
    asWatchSubject(reactive).triggerEffects()
}
