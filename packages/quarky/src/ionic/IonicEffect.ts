import { Watchable, Watched } from "../watch/Watched";
import { IonicCompound, MaybeIonicCompound } from "./IonicCompound";

type IonicEffect = MaybeIonicCompound<EffectCompound>

export class EffectCompound extends IonicCompound<IonicEffect> implements Watchable {
   asWatched: Watched = new Watched(this)

   override trigger(): void {
      this.dirty = true;
      this.asWatched.triggerEffects()
   }
}

let currentEffect: Function | undefined

export function createIonicEffect(task: () => any, retrack: boolean = true) {
   const compound: EffectCompound = new EffectCompound(effect)

   let initialized = false;
   // let prevCycle: any;
   function effect() {
      // const currentCycle = $currentCycle()
      // if (prevCycle === currentEffect) {
      //    return; // prevent infinite loop for synchronous effects
      // }
      // prevCycle = currentCycle;
      if (!initialized || retrack && compound.dirty) {
         try {
            compound.trackAtoms(task)
         }
         finally {
            compound.dirty = false;
         }
      }
      else {
         task()
      }
   }
   effect.asIonicCompound = compound;

   return effect
}