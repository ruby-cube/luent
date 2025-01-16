import { $schedule, PendingCancelOp } from "@rue/flask";
import { MutationRecord } from "./watch";

export class ThisEffect {

   constructor(
      public mutations?: MutationRecord[] //TODO: Make required?
   ) { }

   private cleanups?: Set<(() => void)>

   get onCleanup() {
      const cleanups = this.cleanups || (this.cleanups = new Set())
      return this._onCleanup || (this._onCleanup = (cleanUp: () => void) => {
         return $schedule(cleanUp, {}, {
            enroll(cb) {
               cleanups.add(cb)
            },
            remove(cb) {
               cleanups.delete(cb)
            }
         })
      })
   }

   private _onCleanup?: (cleanUp: () => void) => PendingCancelOp
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
   // if (!currentEffect) throw new Error('$thisEffect can only be called synchronously within a reactive effect')
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