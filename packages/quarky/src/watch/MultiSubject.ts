import { AnyObject } from "@rue/types";
import { IonicCompound, IonicCompoundMorph } from "../ionic/IonicCompound";
import { IonizedModel } from "../ionized/IonizedModel";
import { unwatch, watch, Watched } from "./Watched";
import { Ion, isIon } from "../ion/Ion";
import { noop } from "@rue/utils";
import { hasQuark, QUARK, quarkOf } from "../Quark";
import { isIonizedModel } from "../ionized/ionize";
import { isParticleMorphic, ParticleMorph } from "../compound/Particle";
import { asCoreIon, isPionCapsule } from "../ionic/PionCapsule";
import { isInertIon } from "../ion/Neutron";
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
         absorbedFn = (model: IonizedModel) => {
            compound.track(quarkOf(model))
         }
         fn = () => {
            compound.untrackParticles()
            return getValues();
         }
      }
   }


   function getValues() {
      const values: unknown[] = []
      for (const subject of subjects) {
         if (isIonizedModel(subject)) {
            absorbedFn(subject)
            values.push(subject)
         }
         else if (isIon(subject) && hasQuark(subject)) {
            if (isInertIon(subject))
               values.push(subject())
            else if (isParticleMorphic(subject)) {
               values.push(getterFn(isPionCapsule(subject) ? asCoreIon(subject)! : subject))
            }
         }
         else if (isGetter(subject)) {
            //TODO: figure out how to retrack ... should we create a watched derivation and just watch that? but watched derivations are terminal
            values.push(trackedCall(subject))
         }
         else {
            // inert object
            values.push(subject)
         }
      }
   }

   return $subjects;
}






