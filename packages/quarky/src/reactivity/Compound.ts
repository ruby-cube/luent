import { Atom } from "./Atom"
import { createStack, isObject } from "@rue/utils"

export const [pushTracker, popTracker, getActiveTracker] = createStack<Compound | null>()



export function untrackedCall(fn: Function) {
   try {
      pushTracker(null)
      return fn();
   }
   finally {
      popTracker()
   }
}



export function track(particle: Particle) {
   getActiveTracker()?.track(particle)
}



export function isTracking() {
   return !!getActiveTracker()
}



/**
 * INTERNAL
 */
export type CompoundMorph<T> = {
   asCompound: T
}

export function isCompound(value: unknown): value is Compound {
   return isObject(value) && 'particles' in value;
}

export type Particle = Atom | Compound

/**
 * INTERNAL
 */
export class Compound {

   private _particles: Set<Particle> = new Set()

   protected particles: Particle[] = []

   track(particle: Particle) {
      if (this._particles.has(particle)) return particle
      this._particles.add(particle)
      this.particles.push(particle)
      return particle;
   }

   protected untrackAtoms() {
      this.particles.length = 0
      this._particles.clear()
   }

   protected forEachAtom(fn: (atom: Atom) => void) {
      const particles = this.particles;
      particles.forEach(particle => {
         if ('forEachAtom' in particle) {
            particle.forEachAtom(fn)
         }
         else {
            fn(particle)
         }
      })
   }
}

export function __DEV__checkIfTracked() {
   if (getActiveTracker()) console.warn(`RESEARCH: This is currently a tracked context. May need to use untrackedCall`)
}

export function __DEV__checkIfNotTracked() {
   if (!getActiveTracker()) console.warn(`RESEARCH: This is currently not a tracked context. untrackedCall may be extraneous`)
}

