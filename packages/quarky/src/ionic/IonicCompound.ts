import { Compound, CompoundMorph, getActiveTracker, isTracking, popTracker, pushTracker, trackParticle, } from "../compound/Compound";



export type IonicCompoundMorph = CompoundMorph<IonicCompound>

export class IonicCompound extends Compound {

   trackCall(fn: () => any) {
      pushTracker(this);
      try {
         const value = fn();
         // if (isIonizedModel(value)) trackParticle(quarkOf(value)) //TODO: not sure if I need this here or only in watched subject
         return value;
      }
      finally {
         popTracker();
         // if (__DEV__ && this.atoms.length === 0) {
         //    console.warn(`Ionic compound has no dependencies (and therefore no reactivity)`, this)
         //    console.trace()
         // }
      }
   }

   retrackCall(fn: () => any) {
      this.untrackAtoms()
      return this.trackCall(fn)
   }

   // untrackAtoms() {
   //    this.atoms.clear()
   // }
}

export function __DEV__checkIfTracked() {
   if (getActiveTracker()) console.warn(`RESEARCH: This is currently a tracked context. May need to use untrackedCall`)
}
export function __DEV__checkIfNotTracked() {
   if (!getActiveTracker()) console.warn(`RESEARCH: This is currently not a tracked context. untrackedCall may be extraneous`)
}


