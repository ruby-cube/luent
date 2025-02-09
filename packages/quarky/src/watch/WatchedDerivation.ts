import { Compound, MaybeCompound, triggerEffects } from "../Compound/Compound";
import { IonicCompound } from "../ionic/IonicCompound";
import { QUARKS } from "../Quarks";
import { Watched } from "./Watched";

type WatchedEntity = MaybeCompound<IonicCompound> & { asWatched: Watched }

export function createWatchedDerivation(derivation: () => any) {
   const quarks = {
      asCompound: undefined as unknown as IonicCompound,
      asWatched: undefined as unknown as Watched
   }
   const compound: IonicCompound = new IonicCompound(quarks)
   compound.trigger = () => triggerEffects(compound)
   quarks.asCompound = compound;
   quarks.asWatched = new Watched(quarks)

   let fn = initialize;
   function $derivation() {
      return fn()
   }
   $derivation[QUARKS] = quarks

   function initialize() {
      fn = derivation
      return compound.trackedCall(derivation)
   }
   return $derivation;
}

function trigger(this: Compound) {

}