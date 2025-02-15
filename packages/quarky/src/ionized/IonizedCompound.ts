import { ParticleMorph, Particle } from "../compound/Particle";
import { AnyObject } from "@rue/types";
import { toRaw } from "./ionize";
import { isIon } from "../ion/ion";
import { Compound, track, untrackParticles, CompoundMorph, triggerEffects } from "../compound/Compound";
import { IonizedModelQuark } from "./IonizedModelQuark";
import { Mutation } from "../mutation/Mutable";
import { hasQuark, quarkOf } from "../Quark";
import { IonizedModel } from "./IonizedModel";
import { IterableSet } from "@rue/utils";
import { DerivationPionQuark } from "../ionic/DerivationPion";

//TODO: 



// export const MEMOIZED_ION = Symbol('Memoized Ion')

// export function isMemoizedIon(value: unknown): value is $MemoizedIon {
//    return hasQuark(value) && quarkOf(value).type === MEMOIZED_ION
// }

// triggerDerivations(newValue: any, oldValue: any) {
//    for (const derivation of this.derivations) {
//       if (isIonizedModel(derivation.o)) { //TODO: move to IonizedCompound?
//          const reactive = derivation.o
//          const quark = this.quark;
//          $effectCycle().recordOp(reactive, {
//             target: quark,
//             op: 'set',
//             args: [newValue],
//             output: newValue,
//             preopData: oldValue
//          })
//       }
//       derivation.trigger();
//    }
// }


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
      // const quark = quarkOf(model)
      // let absorbedIons = quark.absorbedIons
      // if (absorbedIons) {
      //    for (const ion of absorbedIons) {
      //       this.track(ion)
      //    }
      // }
      // absorbedIons = quark.absorbedIons = new IterableSet()
      const target = toRaw(model) as AnyObject;
      for (const key in target) { //TODO: can we make this more efficient than looping though all object keys?
         const value = target[key]
         if (isIon(value)) {
            if (hasQuark(value)) {
               const ion = quarkOf(value) as ParticleMorph
               this.track(ion)
            }
            else {
               // derivation function (no quarks)
               const ion = new DerivationPionQuark(model, key, value) // create an unregistered DerivationPionQuark //QUESTION: not entirely sure this is the right thing to do
               this.track(ion)
            }
         }
      }
   }

   untrackParticles = untrackParticles
}
