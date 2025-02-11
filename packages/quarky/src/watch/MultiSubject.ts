import { AnyObject } from "@rue/types";
import { IonicCompound, MaybeIonicCompound } from "../ionic/IonicCompound";
import { IonizedModel } from "../ionized/IonizedModel";
import { unwatch, watch, Watched } from "./Watched";
import { Ion } from "../ion/Ion";
import { noop } from "@rue/utils";
import { QUARK, quarkOf } from "../Quark";
import { isIonizedModel } from "../ionized/ionize";

export function createMultiSubject(subjects: unknown[] & AnyObject) {
   const quark: MaybeIonicCompound = {
      asCompound: undefined,
      asWatched: undefined,
      watch,
      unwatch: () => unwatch.call(quark)
   }
   const compound: IonicCompound = new IonicCompound(quark)
   quark.asCompound = compound;
   quark.asWatched = new Watched(quark)

   let fn = initialize
   let getterFn = (subject: Ion) => compound.trackedCall(subject)
   let absorbedFn = (subject: IonizedModel) => {
      compound.track(quarkOf(subject))
      maybeInitializeIonizedCompound(subject)
   }
   function $subjects() {
      return fn()
   }
   $subjects[QUARK] = quark

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
         if (isIonizedModel(subject)) {
            absorbedFn(subject)
            values.push(subject)
         }
         else if (isGetter(subject)) {
            values.push(getterFn(subject))
         }
         else {
            if (__DEV__) throw new Error('Invalid watch subject')
         }
      }
   }

   return $subjects;
}

function isGetter(value: unknown): value is () => any {
   return value instanceof Function && value.length === 0;
}

function maybeInitializeIonizedCompound(subject: AnyObject) {
   const quark = quarkOf(subject)
   if (!quark.asCompound) {
      const ionizedCompound = asIonizedCompound(quarkOf(subject))
      ionizedCompound.collectAbsorbedIons(subject) //TODO: but only if not initialized already...
   }
}