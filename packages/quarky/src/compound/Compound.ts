import { asParticle, Particle, ParticleMorph } from "./Particle"
import { Watchable } from "../watch/Watched"
import { isObject } from "@rue/utils"


/**
 * INTERNAL
 */
export type CompoundMorph<T extends Compound = Compound> = {
   asCompound?: T
} & Watchable


/**
 * INTERNAL
 */
export interface Compound {
   quark: Watchable
   particles: Particle[]
   track(entity: ParticleMorph): Particle
   trigger(): void
   untrackParticles(): void
}

export function isCompound(value: unknown): value is Compound{
   return isObject(value) && 'particles' in value;
}

/**
 * INTERNAL METHOD
 * @param this 
 * @param entity 
 * @returns 
 */
export function track(this: Compound, entity: ParticleMorph) {
   const particle = asParticle(entity)
   if (particle.compounds.has(this)) return particle;
   this.particles.push(particle)
   particle.associate(this)
   return particle;
}


/**
 * INTERNAL METHOD
 * @param this 
 */
export function untrackParticles(this: Compound) {
   this.particles?.forEach(particle => {
      particle.dissociate(this)
   })
   this.particles = []
}


/**
 * INTERNAL PROCEDURE
 * 
 * @param compound 
 */
export function triggerEffects(compound: Compound) {
   compound.quark.asWatched?.triggerEffects()
}