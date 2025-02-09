import { asAtom, isIonicAtom, ReactivePrimitive } from "../compound/Atom";
import { AtomicIon } from "../ion/AtomicIon";
import { asWatched, isWatched } from "../watch/Watched";
import { getCurrentRenderCycle, useRenderCycle } from "../watch/TaskCycle";
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
       asWatched(target).triggerEffects()
      }
      
    triggerIonicAtom(target, newValue, oldValue)
}

export function triggerIonicAtom(target: ReactivePrimitive, newValue?: any, oldValue?: any) {
   if (isIonicAtom(target)) {
      
        asAtom(target).triggerDerivations(newValue, oldValue)
    }
}

// export function triggerIonizedModel(reactive: IonizedModel) {
//     asWatched(reactive).triggerEffects()
// }


export function triggerIonizedModel(
    model: AnyObject,
    op: string,
    args: any[],
    output: any,
    preopData?: any
) {
    if (isWatched(model)) {

        asWatched(model).triggerEffects()

        useRenderCycle().recordOp(model, {
            target: model,
            op,
            args,
            output,
            preopData
        })
    }
}