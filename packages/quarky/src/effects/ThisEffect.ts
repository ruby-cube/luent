import { $schedule } from "@rue/flask";
import { MutationRecord } from "./watch";

export class ThisEffect {

   constructor(
      public mutations?: MutationRecord[] //TODO: Make required?
   ) { }

   private cleanups?: Set<(() => void)>

   onCleanup(cleanUp: () => void) { //TODO: return pending cancel op
      const cleanups = this.cleanups || (this.cleanups = new Set())

      return $schedule(cleanUp, {}, {
         enroll(cb) {
            cleanups.add(cb)
         },
         remove(cb) {
            cleanups.delete(cb)
         }
      })
   }
}

let currentEffect: ThisEffect | undefined;
let prevEffect: ThisEffect | undefined;

export function pushEffect(effect: ThisEffect) {
   prevEffect = currentEffect;
   currentEffect = effect;
}

export function popEffect() {
   currentEffect = prevEffect;
   prevEffect = undefined;
}

export function $thisEffect() {
   if (!currentEffect) throw new Error('$thisEffect can only be called synchronously within a reactive effect')
   return currentEffect;
}

export function runCleanups(effect: ThisEffect | undefined) {
   if (!effect) return;
   //@ts-expect-error readonly
   const cleanups = effect.cleanups
   if (!cleanups) return;
   for (const cleanUp of cleanups) {
      cleanUp()
   }
}