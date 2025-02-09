import { Particle, MaybeParticle, asParticle } from "../Compound/Particle";
import { Compound, MaybeCompound,  track, untrackParticles } from "../Compound/Compound";
import { Watchable } from "../watch/Watched";

const trackerStack: (Compound | null)[] = []

function pushTracker(tracker: Compound | null) {
   trackerStack.push(tracker)
}

function popTracker() {
   return trackerStack.pop()
}

let pauseTracking = false

export function getActiveTracker() {
   if (pauseTracking) return undefined;
   return trackerStack.at(-1)
}

export function isTrackedContext() {
   return Boolean(getActiveTracker())
}

/**
 * Pauses tracking for all of a function's call, even if there are nested memoized ion trackers in the call.
 * Contrasts with detachedCall, which still allows nested trackers to track.
 * @param fn 
 * @returns 
 */
export function untrackedCall(fn: Function) {
   pauseTracking = true;
   try {
      return fn();
   }
   finally {
      pauseTracking = false;
   }
}

/**
 * For memoized ions, which are both atom and compound to be called within watch and not be tracked by the outer tracking context.
 * @param fn 
 * @returns 
 */
export function detachedCall(fn: Function) {
   pushTracker(null)
   try {
      return fn();
   }
   finally {
      popTracker()
   }
}





export class IonicCompound<T extends MaybeCompound = { asCompound?: IonicCompound } & Watchable> implements Compound {

   constructor(
      readonly quarks: T,
   ) {
   }

   state?: unknown

   dirty: boolean = false;

   particles: Particle[] = []

   track = track

   trigger!: () => void

   trackedCall(fn: () => any) {
      pushTracker(this);
      try {
         return fn();
      }
      finally {
         popTracker();
         if (__DEV__ && this.particles.length === 0) {
            throw new Error('Watch target or derived AtomicIon has no dependencies (and therefore no reactivity', { cause: 'no dependencies' })
         }
      }
   }

   untrackParticles = untrackParticles
}

export function __devCheckIfTracked() {
   if (isTrackedContext()) console.warn(`RESEARCH: This is currently a tracked context. May need to use untrackedCall`)
}
export function __devCheckIfNotTracked() {
   if (!isTrackedContext()) console.warn(`RESEARCH: This is currently not a tracked context. untrackedCall may be extraneous`)
}


