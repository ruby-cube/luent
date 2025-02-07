import { IonicCompound } from "./IonicCompound";

export const CLEAN_UP = 'x__cleanUp'


export interface MaybeIonicAtom {
   asIonicAtom?: IonicAtom
}

/**
 * - Atomic Ions, Atomic Pions, Tracked Ops, Memoized Derivations, maybe Ionized Model
 */
export class IonicAtom {
   constructor(
      public atom: MaybeIonicAtom
   ) {
   }

   compounds: Set<IonicCompound> = new Set()

   addCompound(compound: IonicCompound) {
      this.compounds.add(compound)
   }

   removeCompound(compound: IonicCompound) {
      this.compounds.delete(compound);
      this.cleanUp?.(this.atom)
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
   //          const atom = this.quarks;
   //          useRenderCycle().recordOp(reactive, {
   //             target: atom,
   //             op: 'set',
   //             args: [newValue],
   //             output: newValue,
   //             preopData: oldValue
   //          })
   //       }
   //       derivation.trigger();
   //    }
   // }

   cleanUp?: (atom: MaybeIonicAtom) => void

   onUntracked(cleanUp: (atom: MaybeIonicAtom) => void) {
      if (__DEV__ && this.cleanUp) {
         console.error('Overriding existing cleanup function. This means we need an array for onUntracked tasks')
      }
      this.cleanUp = cleanUp;
   }
}

//TODO: need to initialize memoized derivations and maybe ionized models as ionic atoms
export function asAtom(entity: MaybeIonicAtom) {
   return entity.asIonicAtom ?? (entity.asIonicAtom = new IonicAtom(entity))

}


