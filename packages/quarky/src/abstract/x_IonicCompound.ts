import { Compound, CompoundMorph, getActiveTracker, inTrackedScope, popTracker, pushTracker, track, } from "../reactivity/Compound";



export type IonicCompoundMorph = CompoundMorph<IonicCompound>

export class IonicCompound extends Compound {
   trackCall: (fn: () => any) => any;

   constructor(
      shouldForwardAtoms: boolean = false
   ) {
      super()
      this.trackCall = shouldForwardAtoms ? (fn: () => any) => this.call(fn) : (fn: () => any) => detachedCall(() => this.call(fn))
   }

   private call(fn: () => any) {
      pushTracker(this);
      try {
         return fn();
      }
      finally {
         popTracker();
         // if (__DEV__ && this.atoms.length === 0) {
         //    console.warn(`Ionic compound has no dependencies (and therefore no reactivity)`, this)
         //    console.trace()
         // }
      }
   }

   protected retrackCall(fn: () => any) {
      this.untrackAtoms()
      return this.trackCall(fn)
   }
}



