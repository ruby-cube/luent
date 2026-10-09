import { Stateful } from "../abstract/Stateful";
import { TraceableEntity } from "../debug/Traceable";
import { Atom } from "./Atom"
import { createStack, isObject } from "@luently/utils"

export const [pushTracker, popTracker, getActiveTracker] = createStack<Compound | null>()



export function untracked(fn: Function) {
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



export function inTrackedScope() {
   return !!getActiveTracker()
}



export type Particle = Atom | Compound & TraceableEntity & Stateful

/**
 * INTERNAL
 */
export class Compound {

   private _particles: Set<Particle> = new Set()

   particles: Particle[] = []

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
      let particles = [this.particles];
      for (let i = 0; i < particles.length; i++) {
         const atoms = particles[i]
         for (const atom of atoms) {
            if ('forEachAtom' in atom) {
               particles.push(atom.particles)
            }
            else {
               fn(atom)
            }
         }
      }
   }
}

export function __DEV__checkIfTracked() {
   if (__INTERNAL__ && getActiveTracker()) console.warn(`RESEARCH: This is currently a tracked context. May need to use untracked`)
}

export function __DEV__checkIfNotTracked() {
   if (__INTERNAL__ && !getActiveTracker()) console.warn(`RESEARCH: This is currently not a tracked context. untracked may be extraneous`)
}

