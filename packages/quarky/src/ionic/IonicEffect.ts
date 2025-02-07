import { Watchable, WatchSubject } from "../watch/WatchSubject";
import { IonicCompound, MaybeIonicCompound } from "./IonicCompound";

type IonicEffect = MaybeIonicCompound<EffectCompound>

export class EffectCompound extends IonicCompound<IonicEffect> implements Watchable {
   asWatchSubject: WatchSubject = new WatchSubject(this)

   override trigger(): void {
      this.dirty = true;
      this.asWatchSubject.triggerEffects()
   }
}

export function createIonicEffect(task: () => any, retrack: boolean = true) {
   const compound: EffectCompound = new EffectCompound(effect)
   
   let initialized = false;
   function effect() {
      if (!initialized || retrack && compound.dirty) {
         compound.trackAtoms(task)
         compound.dirty = false;
      }
      else {
         task()
      }
   }
   effect.asIonicCompound = compound;

   return effect
}