import { triggerEffects } from "../compound/Compound";
import { $AtomicIonState } from "../ion/AtomicIon";
import { $AtomicPionState } from "../ion/AtomicPion";
import { IonicCompound, IonicCompoundMorph } from "../ionic/IonicCompound";
import { isIonizedModel } from "../ionized/ionize";
import { hasQuark, QUARK, quarkOf } from "../Quark";
import { unwatch, watch, Watched } from "./Watched";

const WATCHED_IONIZED_ION = 'watched ionized ion'

export function isWatchedIonizedIon(value: unknown): value is WatchedIonizedIon {
   return hasQuark(value) && (<WatchedIonizedIon>quarkOf(value)).type === WATCHED_IONIZED_ION
}

type WatchedIonizedIon = { type: string } & IonicCompoundMorph

export function createWatchedIonizedIon($state: $AtomicIonState | $AtomicPionState) {
   console.log('%watched%ionized%ion')
   const quark: WatchedIonizedIon = {
      type: WATCHED_IONIZED_ION,
      asCompound: undefined,
      asWatched: undefined,
      watch,
      unwatch: () => unwatch.call(quark)
   }
   const compound: IonicCompound = new IonicCompound(quark)
   compound.trigger = () => triggerEffects(compound)

   quark.asCompound = compound;
   quark.asWatched = new Watched(quark)

   function $watchedIon() {
      const state = $state()
      compound.untrackParticles()
      compound.track(quarkOf($state))
      if (isIonizedModel(state)) {
         compound.track(quarkOf(state))
      }
      return state;
   }
   $watchedIon[QUARK] = quark

   return $watchedIon;
}