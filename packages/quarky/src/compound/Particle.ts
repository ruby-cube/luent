import { IterableSet } from "@rue/utils";
import { Compound } from "./Compound";
import { Mutation } from "../watch/watch";

export const CLEAN_UP = 'x__cleanUp'


export interface MaybeParticle {
   asParticle?: Particle
}

/**
 * - Atomic Ions, Atomic Pions, Tracked Ops, Memoized Derivations, maybe Ionized Model
 */
export class Particle {
   constructor(
      public quarks: MaybeParticle
   ) {
   }

   compounds: IterableSet<Compound> = new IterableSet()

   addCompound(compound: Compound) {
      this.compounds.add(compound)
   }

   removeCompound(compound: Compound) {
      this.compounds.delete(compound);
      this.cleanUp?.(this.quarks)
   }

   triggerCompounds(mutation: Mutation) {
      const compounds = this.compounds;
      for (const compound of compounds){
         compound.trigger(mutation)
      }
   }

   discard(){
      this.quarks.asParticle = undefined; 
      //TODO: when should this be called such that we don't cause thrashing of discarding and creating an Particle more than needed?
   }

   cleanUp?: (quarks: MaybeParticle) => void

   onUntracked(cleanUp: (quarks: MaybeParticle) => void) {
      if (__DEV__ && this.cleanUp) {
         console.error('Overriding existing cleanup function. This means we need an array for onUntracked tasks')
      }
      this.cleanUp = cleanUp;
   }
}

//TODO: need to initialize memoized derivations and maybe ionized models as ionic particles
export function asParticle(quarks: MaybeParticle) {
   return quarks.asParticle ?? (quarks.asParticle = new Particle(quarks))
}


