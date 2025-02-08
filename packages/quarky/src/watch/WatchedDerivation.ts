import { TerminalCompound } from "../ionic/IonicEffect";
import { QUARKS } from "../Quarks";
import { Watched } from "./Watched";

export function createWatchedDerivation(derivation: () => any) {
   const quarks = {
      asCompound: undefined as unknown as TerminalCompound,
      asWatched: undefined as unknown as Watched
   }
   const compound: TerminalCompound = new TerminalCompound(quarks)
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