import { asIonicAtom, isIonicAtom, ReactivePrimitive } from "../ionic/IonicAtom";
import { AtomicIon } from "../ion/PrimaryIon";
import { asWatchSubject, isWatched } from "../watch/WatchSubject";
import { getCurrentRenderCycle, useRenderCycle } from "../watch/RenderCycle";
import { untrackedCall } from "../ionic/x_DependencyTracker";
import { isIonicEffectAtom } from "../ionic/IonicEffect";
import { isCurrentWatchSubject } from "../watch/watch";
import { PropIon } from "../ionized/PrimaryPion";
import { AnyObject } from "@rue/types";


export function trigger(target: AtomicIon | PropIon, newValue?: any, oldValue?: any) {
    if (__DEV__ && getCurrentRenderCycle() && getCurrentRenderCycle()!.phase > 1)
        console.warn(`CASE RESEARCH: Reactive entity triggered during phase ${getCurrentRenderCycle()!.phase}:`, target, untrackedCall(target))

    // prevent infinite loops for synchronous effects
    if (isIonicEffectAtom(target) || isCurrentWatchSubject(target))
        return;

    if (isWatched(target)) {
       asWatchSubject(target).triggerEffects()
      }
      
    triggerIonicAtom(target, newValue, oldValue)
}

export function triggerIonicAtom(target: ReactivePrimitive, newValue?: any, oldValue?: any) {
   if (isIonicAtom(target)) {
      
        asAtom(target).triggerDerivations(newValue, oldValue)
    }
}

// export function triggerIonizedModel(reactive: IonizedModel) {
//     asWatchSubject(reactive).triggerEffects()
// }


export function triggerIonizedModel(
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