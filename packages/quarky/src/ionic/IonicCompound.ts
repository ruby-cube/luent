import { Compound, CompoundMorph } from "../compound/Compound";
import { isIonizedModel } from "../ionized/ionize";
import { Quark, quarkOf } from "../Quark";
import { Watchable } from "../watch/Watched";
import { ManagedDerivation } from "./DerivationIon";

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

// export function getActiveTracker() {
//    if (pauseTracking) return undefined;
//    return {
//       track(atom: unknown){
//          for (const tracker of trackerStack){

//          }
//       }
//    }
// }

export function getActiveTrackers() {
   if (pauseTracking) return undefined;
   return trackerStack
}

// export function track(atom: any){

// }


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
 * For memoized ions, which are both particles and compounds to be called within watch and not be tracked by the outer tracking context.
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

export function track(atom: Watchable) {
   let i = trackerStack.length;
   while (i--) {
      const compound = trackerStack[i]
      if (!compound) return; // due to detached call (for nested ionicTasks and eager watch calls)
      compound.track(atom)
   }
}

/**
 * Use trackMemoized to collect/forward the atoms of a memoized compound if the memoized compound is not dirty
 * If dirty, simply retrack and track atoms as normal
 * @param derivation 
 */
export function trackMemoized(ion: ManagedDerivation) {
   let i = trackerStack.length;
   while (i--) {
      const compound = trackerStack[i]
      if (!compound) return; // due to detached call (for nested ionicTasks)
      const atoms = ion.asCompound?.atoms
      if (atoms)
         for (const atom of atoms) {
            compound.track(atom)
         }
   }
}


export type IonicCompoundMorph = CompoundMorph<IonicCompound>

export class IonicCompound extends Compound {

   // dirty: boolean = false;

   // atoms: Set<Watchable> = new Set()

   // track(atom: Watchable) {
   //    this.atoms.add(atom)
   //    return atom
   // }

   trackedCall(fn: () => any) {
      // this.untrackAtoms()
      pushTracker(this);
      try {
         const value = fn();
         if (isIonizedModel(value)) this.track(quarkOf(value))
         return value;
      }
      finally {
         popTracker();
         if (__DEV__ && this.atoms.size === 0) {
            console.warn(`Watch target or derived AtomicIon has no dependencies (and therefore no reactivity)`, this)
         }
      }
   }

   retrackedCall(fn: () => any) {
      this.untrackAtoms()
      return this.trackedCall(fn)
   }

   // untrackAtoms() {
   //    this.atoms.clear()
   // }
}

export function __devCheckIfTracked() {
   if (isTrackedContext()) console.warn(`RESEARCH: This is currently a tracked context. May need to use untrackedCall`)
}
export function __devCheckIfNotTracked() {
   if (!isTrackedContext()) console.warn(`RESEARCH: This is currently not a tracked context. untrackedCall may be extraneous`)
}


