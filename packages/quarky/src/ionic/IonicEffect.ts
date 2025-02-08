import { QUARKS } from "../Quarks";
import { Watched } from "../watch/Watched";
import { IonicCompound, MaybeIonicCompound } from "./IonicCompound";

type IonicEffect = MaybeIonicCompound<TerminalCompound> & { asWatched: Watched }

/**
 * A terminal compound is the "end" of a reactive chain, i.e. the compound is not the atom of a larger compound.
 */
export class TerminalCompound extends IonicCompound<IonicEffect> {

   constructor(
      compound: IonicEffect
   ) {
      super(compound)
   }
   override trigger(): void {
      this.dirty = true;
      this.compound.asWatched!.triggerEffects()
   }
}

let currentEffect: Function | undefined

export function createIonicEffect(task: () => any, retrack: boolean = true) {
   const compound: TerminalCompound = new TerminalCompound(effect)

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

   return effect
}


