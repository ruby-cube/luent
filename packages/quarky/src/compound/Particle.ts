import { IterableSet } from "@rue/utils";
import { Compound } from "./Compound";
import { Mutation } from "../actions/Mutable";
import { EntityQuark, hasQuark, QUARK, quarkOf } from "../Quark";
import { AnyObject } from "@rue/types";

export const CLEAN_UP = 'x__cleanUp'


export interface ParticleMorph extends EntityQuark<AnyObject> {
   asParticle?: Particle
}


/**
 * - Atomic Ions, Atomic Pions, Tracked Ops, Memoized Derivations, maybe Ionized Model
 */
export class Particle {
   constructor(
      public quark: ParticleMorph
   ) {
   }

   compounds: IterableSet<Compound> = new IterableSet()

   associate(compound: Compound) {
      this.compounds.add(compound)
   }

   dissociate(compound: Compound) {
      this.compounds.delete(compound);
      this.cleanUp?.(this.quark)
   }

   triggerCompounds(mutation: Mutation) {
      const compounds = this.compounds;
      for (const compound of compounds) {
         compound.trigger(mutation)
      }
   }

   discard() {
      this.quark.asParticle = undefined;
      //TODO: when should this be called such that we don't cause thrashing of discarding and creating an Particle more than needed?
   }

   cleanUp?: (quark: ParticleMorph) => void

   onDissociated(cleanUp: (quark: ParticleMorph) => void) {
      if (__DEV__ && this.cleanUp) {
         console.error('Overriding existing cleanup function. This means we need an array for onUntracked tasks')
      }
      this.cleanUp = cleanUp;
   }
}

//TODO: need to initialize memoized derivations and maybe ionized models as ionic particles
export function asParticle(quark: ParticleMorph) {
   return quark.asParticle ?? (quark.asParticle = new Particle(quark))
}


