import { AnyObject } from "@rue/types";
import { toRaw } from "./ionize";
import { isIon } from "../ion/Ion";
import { Compound } from "../compound/Compound";
import { hasQuark, quarkOf } from "../Quark";
import { IonizedModel } from "./IonizedModel";
import { DerivationPionQuark } from "../ionic/DerivationPion";

export class IonizedCompound extends Compound {

   collectAbsorbedIons(model: IonizedModel) {
      const target = toRaw(model) as AnyObject;
      for (const key in target) {
         const value = target[key]
         if (isIon(value)) {
            if (hasQuark(value)) {
               const ion = quarkOf(value)
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
}
