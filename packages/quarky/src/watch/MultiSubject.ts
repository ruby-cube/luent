import { AnyObject } from "@rue/types";
import { IonicCompound, MaybeIonicCompound } from "../ionic/IonicCompound";
import { IonizedModel } from "../ionized/IonizedModel";
import { unwatch, watch, Watched } from "./Watched";
import { Ion } from "../ion/Ion";
import { noop } from "@rue/utils";
import { QUARK, quarkOf } from "../Quark";
import { isIonizedModel } from "../ionized/ionize";
import { AtomicIon, isAtomicIon } from "../ion/AtomicIon";
import { isManagedDerivation, ManagedDerivation } from "../ionic/DerivationIon";
import { MaybeParticle } from "../Compound/Particle";

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
   let getterFn = (subject: Ion & (AtomicIon | ManagedDerivation)) => { //TODO: what about pions?
      compound.track(quarkOf(subject))
      return subject()
   }
   let trackedCall = (subject: Ion) => compound.trackedCall(subject) //Question .. if it's an atomic ion or memoized ion, then you track those items
   let absorbedFn = (model: IonizedModel) => {
      const modelQuark = quarkOf(model)
      compound.track(modelQuark)
      modelQuark.trackAbsorbedIons()
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
         trackedCall = (subject: Ion) => subject()
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
         else if (isAtomicIon(subject) || isManagedDerivation(subject) && !quarkOf(subject).inert) {
            values.push(getterFn(subject))
         }
         else if (isGetter(subject)) {
            values.push(trackedCall(subject))
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

