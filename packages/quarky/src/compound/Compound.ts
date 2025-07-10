import { Watchable } from "../watch/Watched"
import { isObject } from "@rue/utils"


/**
 * INTERNAL
 */
export type CompoundMorph<T> = {
   asCompound?: T
} & Watchable

export function isCompound(value: unknown): value is Compound {
   return isObject(value) && 'atoms' in value;
}

/**
 * INTERNAL
 */
export interface Compound {
   atoms: Set<Watchable>
   track(atom: Watchable): Watchable
   untrackAtoms(): void
}



// /**
//  * INTERNAL METHOD
//  * @param this 
//  * @param entity 
//  * @returns 
//  */
// export function track(this: Compound, entity: ParticleMorph) {
//    const particle = asParticle(entity)
//    if (particle.compounds.has(this)) return particle;
//    this.particles.push(particle)
//    particle.associate(this)
//    return particle;
// }


// /**
//  * INTERNAL METHOD
//  * @param this 
//  */
// export function untrackAtoms(this: Compound) {
//    this.particles?.forEach(particle => {
//       particle.dissociate(this)
//    })
//    this.particles = []
// }


// /**
//  * INTERNAL PROCEDURE
//  * 
//  * @param compound 
//  */
// export function triggerEffects(compound: Compound) {
//    compound.quark.asWatched?.triggerEffects()
// }