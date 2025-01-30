import { DependencyTracker, getActiveTracker, getDependencyTracker } from "./DependencyTracker";
import { asIonicAtom, IonicAtom, ReactivePrimitive } from "./IonicAtom";
import { asWatchSubject, isWatched, WatchSubject } from "../effects/WatchSubject";
import { ReactiveEntity } from "../ReactiveEntity";
import { Ionized, isIonizedModel, toRaw } from "../ionize/ionize";
import { isDerivedIon } from "./DerivedIon";
import { isPropIon } from "../ionize/PropIon";
import { isAtomicIon } from "../ion/AtomicIon";
import { AnyObject } from "@rue/types";



export class IonicDerivation<T = any> implements ReactiveEntity {

   constructor(
      readonly o: T,
      readonly type: symbol,
      public readonly retrack: boolean = true
   ) {
   }

   readonly dirty: boolean = false;

   markDirty() {
      // @ts-expect-error readonly
      this.dirty = true;
   }

   undirty() {
      // @ts-expect-error readonly
      this.dirty = false;
   }

   trigger() {
      this.markDirty()
      const o = this.o
      if (isWatched(o)) {
         asWatchSubject(o).triggerEffects();
      }
   }

   atoms?: Set<IonicAtom>

   trackAtoms(ionicDerivation: (() => any) | Ionized<AnyObject>) {
      console.log('tracking atoms')
      const tracker = new DependencyTracker();
      let value;
      let deps: Set<IonicAtom>;
      if (isIonizedModel(ionicDerivation)) {
         deps = collectAbsorbedIons(ionicDerivation, tracker);
      }
      else {
         [deps, value] = tracker.callToCollectDependencies(ionicDerivation);
      }
      this.atoms = deps;
      this.initializeAtoms(deps)
      return value;
   }

   private initializeAtoms(atoms: Set<IonicAtom>) {
      for (const atom of atoms) {
         atom.addDerivation(this)
      }
   }

   forwardAtoms(atoms: Set<IonicAtom>) {
      const tracker = getActiveTracker()
      if (tracker) {
         for (const atom of atoms) {
            tracker.deps.add(atom)
         }
      }
   }

   untrackAtoms() {
      console.log('untracking atoms')
      const atoms = this.atoms;
      if (!atoms) return;
      for (const atom of atoms) {
         atom.deleteDerivation(this)
      }
      this.atoms = undefined;
   }
}


function collectAbsorbedIons(ionicModel: Ionized<AnyObject>, tracker: DependencyTracker) {
   const target = toRaw(ionicModel);
   for (const key in target) {
      const value = target[key]
      if (isAtomicIon(value) || isPropIon(value)) {
         tracker.track(value)
      }
      else if (isDerivedIon(value)) {
         tracker.callToCollectDependencies(value)
      }
   }
   return tracker.deps
}

