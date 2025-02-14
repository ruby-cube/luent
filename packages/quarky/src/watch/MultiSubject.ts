import { AnyObject } from "@rue/types";
import { IonicCompound, IonicCompoundMorph } from "../ionic/IonicCompound";
import { IonizedModel } from "../ionized/IonizedModel";
import { unwatch, watch, Watched } from "./Watched";
import { Ion, isIon } from "../ion/ion";
import { noop } from "@rue/utils";
import { hasQuark, QUARK, quarkOf } from "../Quark";
import { isIonizedModel } from "../ionized/ionize";
import { isParticleMorphic, ParticleMorph } from "../Compound/Particle";
import { asCoreIon, isPionCapsule } from "../ionic/PionCapsule";
import { isNeutron } from "../ion/Neutron";
import { isGetter } from "./watch";

const MULTISUBJECT_ION = 'MultisubjectIon'

export function isMultisubjectIon(value: unknown): value is () => unknown[] & { [QUARK]: IonicCompoundMorph } {
   return hasQuark(value) && (<MultisubjectIon>quarkOf(value)).type === MULTISUBJECT_ION
}

type MultisubjectIon = {
   type: string
} & IonicCompoundMorph

export function createMultisubjectIon(subjects: unknown[] & AnyObject) {
   const quark: MultisubjectIon = {
      type: MULTISUBJECT_ION,
      asCompound: undefined,
      asWatched: undefined,
      watch,
      unwatch: () => unwatch.call(quark)
   }
   const compound: IonicCompound = new IonicCompound(quark)
   quark.asCompound = compound;
   quark.asWatched = new Watched(quark)

   let fn = initialize
   let getterFn = (subject: Ion & { [QUARK]: ParticleMorph }) => {
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
         else if (isIon(subject)) {
            if (isNeutron(subject))
               values.push(subject())
            else if (isParticleMorphic(subject)) {
               values.push(getterFn(isPionCapsule(subject) ? asCoreIon(subject)! : subject))
            }
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






