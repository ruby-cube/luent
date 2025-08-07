import { AnyObject } from "@rue/types";
import { Effect } from "../effect-cycle/EffectQueue"
import { IonizedModel } from "../ionized/IonizedModel"
import { hasQuark, QUARK, Quark, quarkOf } from "../Quark"
import { asWatchedAtom, isWatchable, isWatchableEntity, Watchable, WatchedAtom } from "./WatchedAtom"
import { isFunction, isObject, noop } from "@rue/utils";
import { Ionized, isIonizedModel, toRaw } from "../ionized/ionize";
import { Ion, isIon, toValue } from "../ion/Ion";
import { $currentOrNextCycle } from "../effect-cycle/ReactivitySystem";
import { Phase, SYNC } from "../effect-cycle/EffectCycle";
import { WatchSubjects } from "./watch";
import { IonicCompound } from "../ionic/IonicCompound";
import { Compound, detachedCall, getActiveTracker, isParticle, Particle, popTracker, pushTracker, } from "../compound/Compound";
import { isAtomic } from "../ion/AtomicIon";

export function isWatchSubject(value: AnyObject): value is WatchSubject {
   if ('inert' in value) return !value.inert;
   return false;
}

const MULTISUBJECT = '--multisubject' as const

export function multisubject<S extends unknown[]>(...subject: S) {
   const subj = subject as S & { [MULTISUBJECT]: true }
   subj[MULTISUBJECT] = true;
   return subj;
}


// watch collection
// watch properties -- must specify which properties to watch in multi subject: absorbed ions and derivation ions

export function asWatchSubject(subject: Ionized<object> | Ion<any> | WatchSubjects, retrack?: boolean): WatchSubject | AnyObject {
   return isMultiSubject(subject) ? new Multisubject(subject) //TODO:
      : asSingleWatchSubject(subject, retrack)
}

function asSingleWatchSubject(subject: Ionized<object> | Ion<any> | AnyObject, retrack?: boolean) {
   return isIonizedModel(subject) ? new IonizedModelSubject(subject)
      : isFunction(subject) ? new IonSubject(subject)
         // : isGetter(subject) ? new IonSubject(createWatchedDerivation(subject, !!retrack))
         : isObject(subject) ? subject  //non-ionized object
            : invalidSubject
}

function isMultiSubject(subject: AnyObject): subject is WatchSubjects {
   return MULTISUBJECT in subject;
}

const invalidSubject = {}



class Multisubject implements WatchSubject {
   private subjects: AnyObject[] = []
   private values: unknown[] = []
   inert: boolean = false;

   constructor(multisubject: WatchSubjects) {
      const subjects = this.subjects;
      for (const subject of multisubject) {
         const watchSubject = asSingleWatchSubject(subject)
         subjects.push(watchSubject)
      }
   }

   private initialized = false;

   inertCount: number = 0;

   trackedCall() {
      const subjects = this.subjects;
      const values = this.values
      const initialized = this.initialized

      for (const subject of subjects) {
         if (!isWatchSubject(subject)) {
            values.push(toValue(subject))
            if (!initialized) this.inertCount++
         }
         const value = subject.trackedCall()
         values.push(value)
      }

      if (!initialized) {
         if (this.inertCount === subjects.length) {
            this.inert = true;
         }
         this.initialized = true;
      }
      return values;
   }

   linkEffect(effect: Effect): void {
      const subjects = this.subjects;
      for (const subject of subjects) {
         if (!isWatchSubject(subject)) continue;
         subject.linkEffect(effect)
      }
   }
}

export function isGetter(value: unknown): value is () => any {
   return value instanceof Function && value.length === 0;
}

export interface WatchSubject {
   inert: boolean,
   trackedCall: () => unknown
   linkEffect(effect: Effect): void
}



/**
 * Watching ionized models will NOT track absorbed ions and derivations. 
 * To watch absorbed ions and derivations, use multisubject
 */
class IonizedModelSubject extends Compound implements WatchSubject {
   inert: boolean = false

   constructor(
      private model: IonizedModel,
   ) {
      super()
      const modelQuark = quarkOf(model)
      this.atoms.push(modelQuark)
      this.trackAbsorbedIons() //TODO: if absorbed ions can be reassigned, we need to retrack
   }

   trackedCall() {
      return this.model
   }

   linkEffect(effect: Effect) {
      this.forEachAtom(atom => {
         linkEffectToAtom(atom, effect)
      })
   }

   trackAbsorbedIons() {
      pushTracker(this)
      trackPions(this.model)
      popTracker()
   }
}

function trackPions(model: IonizedModel) {
   const compound = getActiveTracker()
   if (!compound) throw new Error('must call trackPions within trackers')
   const target = quarkOf(model).rawTarget;
   const keys = Reflect.ownKeys(target)
   for (const key of keys) {
      const value = target[key]
      //TODO: what about methods?
      if (isIon(value)) {
         if (isWatchableEntity(value)) {
            compound.track(quarkOf(value))
         }
         else {
            //TODO: collect the absorbed ions of derivations and memoized ions
         }
      }
      else {
         model[key]; // initialize pion via access within tracking context
      }
   }
}




/**
 * - relinks value to effect if value is ionized
 * - relinks derivation atoms to effect on every call if derivation ion
 */
export class IonSubject extends IonicCompound implements WatchSubject {
   inert: boolean = false;

   private valueAtom?: Watchable
   retrack: boolean;
   // private quark: { asCompound?: IonicCompound, inert: boolean } & Quark

   constructor(
      private ion: Ion,
   ) {
      super()
      this.retrack = !isAtomic(ion)
   }

   private initialized = false;

   trackedCall() {
      if (this.initialized)
         return this.retrackedCall()

      this.initialized = true;
      const ion = this.ion;
      const quark = hasQuark(ion) ? quarkOf(ion) : undefined
      const value = isParticle(quark) ? this.atoms.push(quark) : detachedCall(() => this.trackCall(ion))

      // this.atoms = compound ? compound.atoms.length ? compound.atoms : (quark.inert = true, [])
      //    : !quark.inert && isWatchable(quark) ? [quark] : []

      if (isIonizedModel(value)) {
         this.valueAtom = quarkOf(value)
         pushTracker(this)
         trackPions(value)
         popTracker()
      }
      return value;
   }

   private retrackedCall() {
      const retrack = this.retrack;
      if (retrack) {
         this.effect.unlink()
         const value = detachedCall(() => this.retrackCall(this.ion))
         this.forEachAtom(atom => {
            linkEffectToAtom(atom, this.effect)
         })
         this.relinkValue(value)
         return value;
      }
      const value = this.ion()
      this.relinkValue(value)
      return value;
   }

   private effect!: Effect;

   linkEffect(effect: Effect) {
      this.effect = effect;
      this.forEachAtom(atom => {
         linkEffectToAtom(atom, effect)
      })
      linkEffectToAtom(this.valueAtom, effect)
   }

   private relinkValue(
      value: unknown,
   ) {
      const prevAtom = this.valueAtom;
      const atom = this.valueAtom = isWatchableEntity(value) ? quarkOf(value) : undefined

      if (atom === prevAtom)
         return;

      // relink effects
      if (prevAtom) {
         this.effect.unlink()
      }
      if (atom) {
         asWatchedAtom(atom).link(this.effect)
      }
   }


}


// function linkEffectToAtoms(atoms: Particle[], effect: Effect, eager: boolean = false) {
//    for (const atom of atoms) {
//       if ('forEachAtom' in atom) {
//          atom.forEachAtom((atom) => {
//             linkEffectToAtom(atom, effect, eager)
//          })
//       }
//       else {
//          linkEffectToAtom(atom, effect, eager)
//       }
//    }
// }

function linkEffectToAtom(atom: Watchable | undefined, effect: Effect) {
   if (!atom) return;
   effect.link(asWatchedAtom(atom))
}

// function toWatchedAtoms(atoms: Set<Watchable>) {
//    const watchedAtoms = [];
//    for (const atom of atoms) {
//       watchedAtoms.push(asWatchedAtom(atom))
//    }
//    return watchedAtoms;
// }


export class IonicTaskSubject extends IonicCompound implements WatchSubject {
   inert: boolean = false;

   atoms: Particle[] = []

   constructor(
      private ionicEffect: () => void,
      private retrack: boolean
   ) {
      super()
   }

   private initialized = false

   trackedCall() {
      if (this.initialized) return this.retrackedCall()
      this.initialized = true;
      detachedCall(() => this.trackCall(this.ionicEffect))
   }

   effect!: Effect

   private retrackedCall() {
      if (!this.retrack) return this.ionicEffect()
      const ionicEffect = this.ionicEffect
      const effect = this.effect
      effect.unlink()
      detachedCall(() => this.retrackCall(ionicEffect))
      this.forEachAtom(atom => {
         linkEffectToAtom(atom, effect)
      })
   }

   linkEffect(effect: Effect): void {
      this.effect = effect;
      this.forEachAtom(atom => {
         linkEffectToAtom(atom, effect)
      })
   }
}