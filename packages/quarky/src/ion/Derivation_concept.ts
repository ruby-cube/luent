import { SYNC } from "@rue/lumo";
import { Effect } from "../reactivity/EffectQueue";
import { IonSubject } from "../reactivity/Subject";
import { Ion } from "./Ion";


function createMemoizedDerivationIon(fn: (prev: unknown) => unknown) {
   function $derivedState() {
      if ($isStale()) {
         $state.value = fn($state())
         $isStale.value = false;
      }
      return $state()
   }
   $derivedState['~ion'] = true as const

   const subject = new IonSubject($derivedState) // TODO: do not watch output
   const $state = Ion(subject.getValue()) // FIX: should be neutrons that can manage lazy state
   const $isStale = Ion(false) // FIX: should be neutrons that can manage lazy state

   subject.linkEffect(new Effect(() => {
      $isStale.value = true;
   }, SYNC))


   return $derivedState
}