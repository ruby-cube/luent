import { asParticle, Particle, MaybeParticle } from "./Particle"
import { Watchable } from "../watch/Watched"
import { Mutation } from "../watch/watch"

export type MaybeCompound<T extends Compound = Compound> = {
   asCompound?: T
} & Watchable

export interface Compound {
   quarks: Watchable
   particles: Particle[]
   track(entity: MaybeParticle): Particle
   trigger(mutation: Mutation): void
   untrackParticles(): void
}

   export function track(this: Compound, entity: MaybeParticle) {
      const particle = asParticle(entity)
      if (particle.compounds.has(this)) return particle;
      this.particles.push(particle)
      return particle;
   }

   export function untrackParticles(this: Compound) {
      this.particles?.forEach(particle => {
         particle.removeCompound(this)
      })
      this.particles = []
   }

   export function triggerEffects(compound: Compound, mutation: Mutation) {
      compound.quarks.asWatched?.triggerEffects(mutation)
   }