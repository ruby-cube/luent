import { IonicAtom, MaybeIonicAtom, asAtom } from "../compound/Atom";
import { Compound, MaybeCompound, track, untrackAtoms } from "../compound/Compound";

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





export class IonicCompound<T extends MaybeCompound = { asCompound?: IonicCompound }> implements Compound {

   constructor(
      readonly compound: T,
   ) {
   }

   state?: unknown

   dirty: boolean = false;

   atoms: IonicAtom[] = []

   track = track

   trigger!: () => void

   trackedCall(fn: () => any) {
      pushTracker(this);
      try {
         return fn();
      }
      finally {
         popTracker();
         if (__DEV__ && this.atoms.length === 0) {
            throw new Error('Watch target or derived AtomicIon has no dependencies (and therefore no reactivity', { cause: 'no dependencies' })
         }
      }
   }

   untrackAtoms = untrackAtoms
}

export function __devCheckIfTracked() {
   if (isTrackedContext()) console.warn(`RESEARCH: This is currently a tracked context. May need to use untrackedCall`)
}
export function __devCheckIfNotTracked() {
   if (!isTrackedContext()) console.warn(`RESEARCH: This is currently not a tracked context. untrackedCall may be extraneous`)
}


