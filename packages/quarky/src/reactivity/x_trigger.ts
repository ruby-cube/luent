import { asParticle, isIonicAtom, ReactivePrimitive } from "../Compound/Particle";
import { AtomicIon } from "../ion/AtomicIon";
import { asWatched, isWatched } from "../watch/Watched";
import { getCurrentRenderCycle, useEffectCycle } from "../watch/TaskCycle";
import { isIonicEffectAtom } from "../ionic/IonicEffect";
import { isCurrentWatchSubject } from "../watch/watch";
import { PropIon } from "../ionized/PrimaryPion";
import { AnyObject } from "@rue/types";
import { untrackedCall } from "../ionic/IonicCompound";


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
      
        asParticle(target).triggerDerivations(newValue, oldValue)
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

        useEffectCycle().recordOp(model, {
            target: model,
            op,
            args,
            output,
            preopData
        })
    }
}