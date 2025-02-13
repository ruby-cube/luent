import { asParticle, Particle, ParticleMorph } from "./Particle"
import { Watchable } from "../watch/Watched"
import { Mutation } from "../actions/Mutable"

export type MaybeCompound<T extends Compound = Compound> = {
   asCompound?: T
} & Watchable

export interface Compound {
   quark: Watchable
   particles: Particle[]
   track(entity: ParticleMorph): Particle
   trigger(mutation: Mutation): void
   untrackParticles(): void
}

export function track(this: Compound, entity: ParticleMorph) {
   const particle = asParticle(entity)
   if (particle.compounds.has(this)) return particle;
   this.particles.push(particle)
   particle.associate(this)
   return particle;
}

export function untrackParticles(this: Compound) {
   this.particles?.forEach(particle => {
      particle.dissociate(this)
   })
   this.particles = []
}

export function triggerEffects(compound: Compound) {
   compound.quark.asWatched?.triggerEffects()
}