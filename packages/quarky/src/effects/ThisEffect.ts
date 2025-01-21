import { $schedule, PendingCancelOp } from "@rue/flask";

export class ThisEffect {
   private tasks?: Set<(() => void)>

   get onDismantle() {
      const tasks = this.tasks || (this.tasks = new Set())
      return this._onDismantle || (this._onDismantle = (cleanUp: () => void) => {
         return $schedule(cleanUp, {}, {
            enroll(_cleanUp) {
               tasks.add(_cleanUp)
            },
            remove(_cleanUp) {
               tasks.delete(_cleanUp)
            }
         })
      })
   }

   private _onDismantle?: (cleanUp: () => void) => PendingCancelOp
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
   const cleanups = effect.tasks
   if (!cleanups) return;
   for (const cleanUp of cleanups) {
      cleanUp()
   }
}