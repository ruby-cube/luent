import { AnyObject } from "@rue/types";
import { Effect } from "./EffectQueue"
import { IonicProxy } from "../ionic/Ionic"
import { hasQuark, QUARK, Quark, quarkOf } from "../abstract/Quark"
import { asTrackedAtom, isTrackableAtom, Atom, TrackedAtom } from "./Atom"
import { isFunction, isObject, noop } from "@rue/utils";
import { Ionized, isIonicProxy, toRaw } from "../ionic/ionize";
import { Ion, isIon, toValue } from "../ion/Ion";
import { WatchSubjects } from "./watch";
import { IonicCompound } from "../abstract/IonicCompound";
import { Compound, detachedCall, getActiveTracker, isParticle, Particle, popTracker, pushTracker, } from "../abstract/Compound";



export function isWatchedSubstance(value: AnyObject): value is WatchedSubstance {
   if ('reactive' in value) return value.reactive;
   return false;
}

const MULTISUBSTANCE = '--multisubject' as const

export function multisubject<S extends unknown[]>(...subject: S) {
   const subj = subject as S & { [MULTISUBSTANCE]: true }
   subj[MULTISUBSTANCE] = true;
   return subj;
}


// watch collection
// watch properties -- must specify which properties to watch in multi subject: absorbed ions and derivation ions

export function asWatchedSubstance(subject: Ionized<object> | Ion<any> | WatchSubjects, retrack: boolean, once: boolean): WatchedSubstance | AnyObject {
   return isMultisubject(subject) ? new Multisubstance(subject, retrack, once)
      : asMonosubstance(subject, retrack, once)
}

function asMonosubstance(subject: Ionized<object> | Ion<any> | AnyObject, retrack: boolean, once: boolean) {
   // TODO: do not retrack if effect runs once
   return isIonicProxy(subject) ? new IonicProxySubject(subject)
      : isFunction(subject) ? new IonSubject(subject)
         : { reactive: false, getValue() { return subject }, linkEffect(effect: Effect) { } }  //non-ionized object
}

function isMultisubject(subject: AnyObject): subject is WatchSubjects {
   return MULTISUBSTANCE in subject;
}



class Multisubstance implements WatchedSubstance {
   private substances: WatchedSubstance[] = []
   reactive: boolean = true;

   constructor(multisubject: WatchSubjects, retrack: boolean, once: boolean) {
      const substances = this.substances;
      for (const substance of multisubject) {
         const watchedSubstance = asMonosubstance(substance, retrack, once)
         substances.push(watchedSubstance)
      }
   }

   inertCount: number = 0;

   private get = () => {
      this.get = () => {
         const values = []
         for (const subject of this.substances) {
            values.push(subject.getValue())
         }
         return values;
      }

      // initial get
      const values = []
      for (const subject of this.substances) {
         values.push(subject.getValue())
         if (!subject.reactive) this.inertCount++
      }

      if (this.inertCount === this.substances.length) {
         this.reactive = false;
      }
      return values;
   }

   getValue() {
      return this.get()
   }

   linkEffect(effect: Effect): void {
      const subjects = this.substances;
      for (const subject of subjects) {
         if (!subject.reactive) continue;
         subject.linkEffect(effect)
      }
   }
}

// export function isGetter(value: unknown): value is () => any {
//    return value instanceof Function && value.length === 0;
// }
export const isGetter = isIon

interface WatchedSubstance extends Substance {
   getValue: () => unknown
}

interface Substance {
   reactive: boolean,
   linkEffect(effect: Effect): void
}


/**
 * Watching ionized models will NOT track absorbed ions and derivations. 
 * To watch absorbed ions and derivations, use multisubject
 */
class IonicProxySubject extends Compound implements WatchedSubstance {
   reactive: boolean = true

   constructor(
      private model: IonicProxy,
   ) {
      super()
      this.track(quarkOf(model))
      this.trackAbsorbedIons() // TODO: if absorbed ions can be reassigned, we need to retrack
   }

   getValue() {
      // TODO: retrack pions??
      return this.model
   }

   linkEffect(effect: Effect) {
      this.forEachAtom(atom => {
         linkEffectToAtom(atom, effect)
      })
   }

   private trackAbsorbedIons() {
      const proxy = this.model
      const target = quarkOf(proxy).rawTarget;
      const keys = Reflect.ownKeys(target)
      for (const key of keys) {
         const value = target[key]
         // TODO: what about methods?
         if (isIon(value)) {
            if (isTrackableAtom(value)) {
               this.track(quarkOf(value))
            }
            else {
               // TODO: collect the absorbed ions of derivations and memoized ions
            }
         }
         else {
            proxy[key]; // initialize pion via access within tracking context
         }
      }
   }
}


export class FunctionalSubstance extends IonicCompound implements Substance {
   reactive: boolean = true; // TODO: mark inert

   atoms: Particle[] = []

   constructor(
      private fn: () => unknown,
      private retrack: boolean
   ) {
      super()
   }

   private call = () => {
      this.call = () => this.retrackedCall();
      return detachedCall(() => this.trackCall(this.fn))
   }

   trackedCall() {
      const value = this.call()
      if (this.atoms.length === 0) this.reactive = false;
      return value;
   }

   effect: Effect | undefined

   private retrackedCall() {
      if (!this.retrack) return this.fn()
      const fn = this.fn
      const effect = this.effect
      if (!effect) throw new Error('Must call linkEffect before retracking')
      effect.unlinkAtoms()
      const output = detachedCall(() => this.retrackCall(fn))
      this.forEachAtom(atom => {
         linkEffectToAtom(atom, effect)
      })
      return output;
   }

   linkEffect(effect: Effect): void {
      this.effect = effect;
      this.forEachAtom(atom => {
         linkEffectToAtom(atom, effect)
      })
   }
}



// export class IonSubject implements WatchedSubstance {
//    get inert() {
//       return this.subject.inert
//    }

//    private subject: FunctionalSubstance

//    constructor(
//       getState: () => unknown,
//       retrack: boolean = true
//    ) {
//       this.subject = new FunctionalSubstance(getState, retrack);
//    }

//    linkEffect(effect: Effect): void {
//       this.subject.linkEffect(effect)
//    }

//    getValue() {
//       return this.subject.trackedCall()
//    }
// }


// function IonSubjectB(
//    // this: WatchedSubstance & IonicCompound & { fn: () => unknown, inert: boolean, retrack: boolean },
//    getState: () => unknown,
//    retrack: boolean = true
// ) {
//    return Object.create(IonSubjectB.prototype, {
//       fn: { value: getState },
//       retrack: { value: retrack },
//       inert: { value: false },
//       initialized: { value: false },
//       _atoms: { value: new Set() },
//       atoms: { value: [] },
//       effect: { value: undefined }
//    })
// }

// IonSubjectB.prototype = {
//    trackCall: IonicCompound.prototype.trackCall,
//    retrackCall: IonicCompound.prototype.retrackCall,
//    track: Compound.prototype.track,
//    untrack: Compound.prototype.untrackAtoms,
//    forEachAtom: Compound.prototype.forEachAtom,
//    linkEffect: FunctionalSubstance.prototype.linkEffect,
//    getValue: FunctionalSubstance.prototype.trackedCall,
//    retrackedCall: FunctionalSubstance.prototype.trackedCall
// }

export class IonSubject implements WatchedSubstance {
   get reactive() {
      if (this.proxySubject) {
         return this.subject.reactive && this.proxySubject.reactive
      }
      return this.subject.reactive
   }

   private subject: FunctionalSubstance
   private proxySubject: IonicProxySubject | undefined

   constructor(
      getState: () => unknown,
      retrack: boolean = true
   ) {
      this.subject = new FunctionalSubstance(getState, retrack);
   }

   linkEffect(effect: Effect): void {
      this.subject.linkEffect(effect)
      this.proxySubject?.linkEffect(effect)
   }

   getValue() {
      const value = this.subject.trackedCall()
      if (value !== this.proxySubject?.getValue() && isIonicProxy(value)) {
         this.proxySubject = new IonicProxySubject(value)
      }
      return value;
   }
}


// /**
//  * - relinks value to effect if value is ionized
//  * - relinks derivation atoms to effect on every call if derivation ion
//  */
// export class IonSubject extends IonicCompound implements WatchedSubstance {
//    inert: boolean = false;

//    private valueAtom?: Atom
//    retrack: boolean;
//    // private quark: { asCompound?: IonicCompound, inert: boolean } & Quark

//    constructor(
//       private ion: Ion,
//    ) {
//       super()
//       this.retrack = isManagedDerivation(ion)
//    }

//    private initialized = false;

//    getValue() {
//       if (this.initialized)
//          return this.retrackedCall()

//       this.initialized = true;
//       const ion = this.ion;
//       const quark = hasQuark(ion) ? quarkOf(ion) : undefined
//       const value = isParticle(quark) ? (this.atoms.push(quark), detachedCall(ion)) : detachedCall(() => this.trackCall(ion))

//       // this.atoms = compound ? compound.atoms.length ? compound.atoms : (quark.inert = true, [])
//       //    : !quark.inert && isWatchable(quark) ? [quark] : []

//       if (isIonicProxy(value)) {
//          this.valueAtom = quarkOf(value)
//          trackAbsorbedIons(this, value)
//       }
//       return value;
//    }

//    private retrackedCall() {
//       const retrack = this.retrack;
//       if (retrack) {
//          this.effect.unlinkAtoms()
//          const value = detachedCall(() => this.retrackCall(this.ion))
//          if (isIonicProxy(value)) {
//             trackAbsorbedIons(this, value)
//          }
//          this.forEachAtom(atom => {
//             linkEffectToAtom(atom, this.effect)
//          })
//          this.relinkValue(value)
//          return value;
//       }
//       else {
//          const value = this.ion()
//          if (isIonicProxy(value)) {
//             trackAbsorbedIons(this, value)
//          }
//          this.forEachAtom(atom => {
//             linkEffectToAtom(atom, this.effect)
//          })
//          this.relinkValue(value)
//          return value;
//       }
//    }

//    private effect!: Effect;

//    linkEffect(effect: Effect) {
//       this.effect = effect;
//       this.forEachAtom(atom => {
//          linkEffectToAtom(atom, effect)
//       })
//       linkEffectToAtom(this.valueAtom, effect)
//    }

//    private relinkValue(
//       value: unknown,
//    ) {
//       linkEffectToAtom(this.valueAtom, this.effect);
//       linkEffectToAtom(this.valueAtom = isTrackableAtom(value) ? quarkOf(value) : undefined, this.effect);
//    }

// }


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

function linkEffectToAtom(atom: Atom | undefined, effect: Effect) {
   if (!atom) return;
   effect.link(asTrackedAtom(atom))
}

// function toWatchedAtoms(atoms: Set<Atom>) {
//    const watchedAtoms = [];
//    for (const atom of atoms) {
//       watchedAtoms.push(asTrackedAtom(atom))
//    }
//    return watchedAtoms;
// }


