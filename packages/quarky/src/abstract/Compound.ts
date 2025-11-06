import { Atom } from "../reactivity/Atom"
import { isObject } from "@rue/utils"

const trackerStack: (Compound | null)[] = []

export function pushTracker(tracker: Compound | null) {
   trackerStack.push(tracker)
}

export function popTracker() {
   return trackerStack.pop()
}

let trackingPaused = false;

export function pauseTracking(){
   trackingPaused = true;
}
export function resumeTracking(){
   trackingPaused = false;
}

export function getActiveTracker() {
   if (trackingPaused) return undefined;
   return trackerStack.at(-1)
}

export function getActiveTrackers() {
   if (trackingPaused) return undefined;
   return trackerStack
}

// export function track(atom: any){

// }




/**
 * Pauses tracking for all of a function's call, even if there are nested memoized ion trackers in the call.
 * Contrasts with detachedCall, which still allows nested trackers to track.
 * @param fn 
 * @returns 
 */
export function untrackedCall(fn: Function) {
   try {
      pauseTracking()
      return fn();
   }
   finally {
      resumeTracking()
   }
}

/**
 * For memoized ions, which are both particles and compounds to be called within watch and not be tracked by the outer tracking context.
 * @param fn 
 * @returns 
 */
export function detachedCall<T extends ((...args: any[]) => any)>(fn: T): ReturnType<T> {
   try {
      pushTracker(null)
      return fn();
   }
   finally {
      popTracker()
   }
}

export function isParticle(value: unknown): value is Particle{
   return isObject(value) && ('asTrackedAtom' in value || 'atoms' in value)
}

export function trackParticle(atom: Particle) {
   let i = trackerStack.length;
   while (i--) {
      const compound = trackerStack[i]
      if (!compound) return; // due to detached call (for nested ionicTasks and eager watch calls)
      compound.track(atom)
   }
}

// /**
//  * Use trackMemoized to collect/forward the atoms of a memoized compound if the memoized compound is not stale
//  * If stale, simply retrack and track atoms as normal
//  * @param compound 
//  */
// export function trackCompound(compound: Compound) {
//    let i = trackerStack.length;
//    while (i--) {
//       const tracker = trackerStack[i]
//       if (!tracker) return; // due to detached call (for nested ionicTasks)
//       const hasAtoms = compound.atoms.length
//       if (hasAtoms)
//          // for (const atom of atoms) {
//          //    compound.track(atom)
//          // }
//          tracker.track(compound)
//    }
// }

/**
 * tracking status whether for ionic compounds or ionized compound
 * @returns 
 */
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
   return isObject(value) && 'atoms' in value;
}

export type Particle = Atom | Compound

/**
 * INTERNAL
 */
export class Compound {

   _atoms: Set<Particle> = new Set()

   atoms: Particle[] = []

   track(atom: Particle) {
      if (this._atoms.has(atom)) return atom
      this._atoms.add(atom)
      this.atoms.push(atom)
      return atom;
   }

   untrackAtoms() {
      this.atoms.length = 0
      this._atoms.clear()
   }

   forEachAtom(fn: (atom: Atom) => void) {
      const atoms = this.atoms;
      atoms.forEach(particle => {
         if ('forEachAtom' in particle) {
            particle.forEachAtom(fn)
         }
         else {
            fn(particle)
         }
      })
   }
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
//    compound.quark.asTrackedAtom?.triggerEffects()
// }