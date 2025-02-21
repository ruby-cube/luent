import { ParticleMorph, Particle } from "../compound/Particle";
import { AnyObject } from "@rue/types";
import { toRaw } from "./ionize";
import { isIon } from "../ion/ion";
import { Compound, track, untrackParticles, CompoundMorph, triggerEffects } from "../compound/Compound";
import { IonizedModelQuark } from "./IonizedModelQuark";
import { hasQuark, quarkOf } from "../Quark";
import { IonizedModel } from "./IonizedModel";
import { DerivationPionQuark } from "../ionic/DerivationPion";

export class IonizedCompound implements Compound {
   
   constructor(
      readonly quark: IonizedModelQuark
   ) {
   }

   particles: Particle[] = []

   track = track

   trigger(): void {
      this.quark.asParticle?.triggerCompounds()
      triggerEffects(this)
   }

   collectAbsorbedIons(model: IonizedModel) {
      const target = toRaw(model) as AnyObject;
      for (const key in target) { 
         const value = target[key]
         if (isIon(value)) {
            if (hasQuark(value)) {
               const ion = quarkOf(value) as ParticleMorph
               this.track(ion)
            }
            else {
               // derivation function (no quarks)
               const ion = new DerivationPionQuark(model, key, value) 
               // create an unregistered DerivationPionQuark //QUESTION: not entirely sure this is the right thing to do
               this.track(ion)
            }
         }
      }
   }

   untrackParticles = untrackParticles
}
