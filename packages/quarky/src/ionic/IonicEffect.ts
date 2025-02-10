import { noop } from "@rue/utils";
import { triggerEffects } from "../Compound/Compound";
import { Watched } from "../watch/Watched";
import { IonicCompound, MaybeIonicCompound } from "./IonicCompound";

type IonicEffect = MaybeIonicCompound
// & { asWatched?: Watched }


export function createIonicEffect(task: () => any, retrack: boolean = true) {
   const compound: IonicCompound<IonicEffect> = new IonicCompound(effect)
   compound.trigger = trigger

   let fn = initialize;

   function effect() {
      return fn()
   }

   function initialize() {
      fn = runEffect
      compound.trackedCall(task)
   }

   function runEffect() {
      if (retrack && compound.dirty) {
         try {
            compound.trackedCall(task)
         }
         finally {
            compound.dirty = false;
         }
      }
      else {
         task()
      }
   }

   effect.asCompound = compound;
   effect.asWatched = new Watched(effect as IonicEffect)
   effect.watch = noop as () => Watched;
   effect.unwatch = noop;

   return effect
}

function trigger(this: IonicCompound<IonicEffect>): void {
   this.dirty = true;
   triggerEffects(this)
}

