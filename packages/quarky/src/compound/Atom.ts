import { Compound } from "../ionic/IonicCompound";

export const CLEAN_UP = 'x__cleanUp'


export interface MaybeIonicAtom {
   asAtom?: IonicAtom
}

/**
 * - Atomic Ions, Atomic Pions, Tracked Ops, Memoized Derivations, maybe Ionized Model
 */
export class IonicAtom {
   constructor(
      public maybeAtom: MaybeIonicAtom
   ) {
   }

   compounds: Set<Compound> = new Set()

   addCompound(compound: Compound) {
      this.compounds.add(compound)
   }

   removeCompound(compound: Compound) {
      this.compounds.delete(compound);
      this.cleanUp?.(this.maybeAtom)
   }

   react() {
      const compounds = this.compounds;
      for (const compound of compounds){
         compound.trigger()
      }
   }

   // triggerDerivations(newValue: any, oldValue: any) {
   //    for (const derivation of this.derivations) {
   //       if (isIonizedModel(derivation.o)) { //TODO: move to IonizedCompound?
   //          const reactive = derivation.o
   //          const maybeAtom = this.quarks;
   //          useRenderCycle().recordOp(reactive, {
   //             target: maybeAtom,
   //             op: 'set',
   //             args: [newValue],
   //             output: newValue,
   //             preopData: oldValue
   //          })
   //       }
   //       derivation.trigger();
   //    }
   // }
   discard(){
      this.maybeAtom.asAtom = undefined; //TODO: when should this be called such that we don't cause thrashing of discarding and creating an IonicAtom more than needed?
   }

   cleanUp?: (maybeAtom: MaybeIonicAtom) => void

   onUntracked(cleanUp: (maybeAtom: MaybeIonicAtom) => void) {
      if (__DEV__ && this.cleanUp) {
         console.error('Overriding existing cleanup function. This means we need an array for onUntracked tasks')
      }
      this.cleanUp = cleanUp;
   }
}

//TODO: need to initialize memoized derivations and maybe ionized models as ionic atoms
export function asAtom(maybeAtom: MaybeIonicAtom) {
   return maybeAtom.asAtom ?? (maybeAtom.asAtom = new IonicAtom(maybeAtom))

}


