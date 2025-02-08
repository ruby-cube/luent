import { AnyObject } from "@rue/types";
import { IonicAtom, MaybeIonicAtom, asAtom } from "./IonicAtom";
import { toRaw } from "../ionized/ionize";
import { isIon } from "../ion/Ion";

const trackerStack: (IonicCompound | null)[] = []

function pushTracker(tracker: IonicCompound | null) {
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


/**
 * for memoized derivations and ionic effects and ionized models
 */
export interface MaybeIonicCompound<T extends IonicCompound = IonicCompound> {
   asCompound?: T
}

export class IonicCompound<T extends MaybeIonicCompound = { asCompound?: IonicCompound }> {

   constructor(
      readonly compound: T,
   ) {
   }
   dirty: boolean = false;

   atoms: IonicAtom[] = []

   track(entity: MaybeIonicAtom) {
      const atom = asAtom(entity)
      if (atom.compounds.has(this)) return;
      this.atoms.push(atom)
      return atom;
   }

   trigger(): void {
      if (__DEV__) console.warn('Not implemented')
   }

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

   untrackAtoms() {
      this.atoms?.forEach(atom => {
         atom.removeCompound(this)
      })
      this.atoms = []
   }

   collectAbsorbedIons(ionicModel: AnyObject) {
      const target = toRaw(ionicModel);
      for (const key in target) {
         const value = target[key]
         if (isIon(value)) {
            this.track(<MaybeIonicAtom>value)
         }
      }
   }
}

// export interface Compound {
//    atoms: Set<IonicAtom>
//    track(entity: MaybeIonicAtom): IonicAtom
//    trigger(): void
// }



export function __devCheckIfTracked() {
   if (isTrackedContext()) console.warn(`RESEARCH: This is currently a tracked context. May need to use untrackedCall`)
}
export function __devCheckIfNotTracked() {
   if (!isTrackedContext()) console.warn(`RESEARCH: This is currently not a tracked context. untrackedCall may be extraneous`)
}


