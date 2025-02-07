import { IonicAtom, MaybeIonicAtom, asAtom } from "./IonicAtom";

const trackerStack: IonicCompound[] = []

function pushTracker(tracker: IonicCompound) {
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
 * for memoized derivations and ionic effects
 */
export interface MaybeIonicCompound {
   asIonicCompound?: IonicCompound
}



export class IonicCompound<T extends MaybeIonicCompound = MaybeIonicCompound> implements Compound {

   constructor(
      readonly compound: T,
   ) {
   }

   atoms: Set<IonicAtom> = new Set()

   trigger(): void {
      if (__DEV__) console.warn('Not implemented')
   }

   trackAtoms(fn: () => any) {
      pushTracker(this);
      try {
         return fn();
      }
      finally {
         popTracker();
         if (__DEV__ && this.atoms.size === 0) {
            throw new Error('Watch target or derived AtomicIon has no dependencies (and therefore no reactivity', { cause: 'no dependencies' })
         }
      }
   }

   untrackAtoms() {
      const atoms = this.atoms;
      if (!atoms) return;
      for (const atom of atoms) {
         atom.removeCompound(this)
      }
      this.atoms.clear()
   }

   track = track
}



export interface Compound {
   atoms: Set<IonicAtom>
   track(entity: MaybeIonicAtom): IonicAtom
   trigger(): void
}

export function track(this: Compound, entity: MaybeIonicAtom) {
   const atom = asAtom(entity)
   this.atoms.add(atom)
   return atom;
}



