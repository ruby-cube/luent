import { AnyObject } from "@rue/types";
import { IonicCompound } from "../ionic/IonicCompound";
import { IonizedModel } from "../ionized/IonizedModel";
import { Watched } from "./Watched";
import { Ion } from "../ion/Ion";
import { noop } from "@rue/utils";
import { QUARKS, quarksOf } from "../Quarks";
import { isIonizedModel } from "../ionized/ionize";
import { isGetter } from "./watch";

export function createMultiSubject(subjects: unknown[] & AnyObject) {
   const quarks = {
      asCompound: undefined as unknown as IonicCompound,
      asWatched: undefined as unknown as Watched
   }
   const compound: IonicCompound = new IonicCompound(quarks)
   quarks.asCompound = compound;
   quarks.asWatched = new Watched(quarks)

   let fn = initialize
   let getterFn = (subject: Ion) => compound.trackedCall(subject)
   let absorbedFn = (subject: IonizedModel) => {
      compound.track(quarksOf(subject))
      maybeInitializeIonizedCompound(subject)
   }
   function $subjects() {
      return fn()
   }
   $subjects[QUARKS] = quarks

   function initialize() {
      try {
         return getValues()
      }
      finally {
         getterFn = (subject: Ion) => subject()
         absorbedFn = noop
         fn = getValues;
      }
   }

   function getValues() {
      const values: unknown[] = []
      for (const subject of subjects) {
         if (isGetter(subject)) {
            values.push(getterFn(subject))
         }
         if (isIonizedModel(subject)) {
            absorbedFn(subject)
            values.push(subject)
         }
      }
   }

   return $subjects;
}

function maybeInitializeIonizedCompound(subject: AnyObject) {
   const quarks = quarksOf(subject)
   if (!quarks.asCompound) {
      const ionizedCompound = asIonizedCompound(quarksOf(subject))
      ionizedCompound.collectAbsorbedIons(subject) //TODO: but only if not initialized already...
   }
}