import { asIonicAtom, isIonicAtom, ReactivePrimitive } from "./derivations/IonicAtom";
import { AtomicIon } from "./ion/AtomicIon";
import { asWatchSubject, isWatched } from "./effects/WatchSubject";
import { getCurrentRenderCycle, useRenderCycle } from "./effects/RenderCycle";
import { getWithoutTracking } from "./derivations/DependencyTracker";
import { isIonicEffectAtom } from "./derivations/IonicEffect";
import { isCurrentWatchSubject } from "./effects/watch";
import { PropIon } from "./ionize/PropIon";
import { AnyObject } from "@rue/types";


export function trigger(target: AtomicIon | PropIon, newValue?: any, oldValue?: any) {
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

// export function triggerIonicModel(reactive: IonizedModel) {
//     asWatchSubject(reactive).triggerEffects()
// }


export function triggerIonicModel(
    model: AnyObject,
    op: string,
    args: any[],
    output: any,
    preopData?: any
) {
    if (isWatched(model)) {

        asWatchSubject(model).triggerEffects()

        useRenderCycle().recordOp(model, {
            target: model,
            op,
            args,
            output,
            preopData
        })
    }
}