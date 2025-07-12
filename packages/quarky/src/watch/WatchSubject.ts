import { AnyObject } from "@rue/types";
import { Effect } from "../effect-cycle/EffectQueue"
import { $AtomicIonState, isAtomicIonQuark } from "../ion/AtomicIon";
import { $AtomicPionState, isAtomicPionQuark } from "../ion/AtomicPion";
import { IonizedModel } from "../ionized/IonizedModel"
import { hasQuark, QUARK, Quark, quarkOf } from "../Quark"
import { asWatched, isWatchable, isWatchableEntity, Watchable, Watched } from "./Watched"
import { isObject, noop } from "@rue/utils";
import { Ionized, isIonizedModel } from "../ionized/ionize";
import { Ion, isIon, toValue } from "../ion/Ion";
import { $currentEffectCycle, scheduleEagerEffect } from "../effect-cycle/ReactivitySystem";
import { Phase, SYNC } from "../effect-cycle/EffectCycle";
import { WatchSubjects } from "./watch";
import { detachedCall, IonicCompound } from "../ionic/IonicCompound";
import { createWatchedDerivation } from "../ionic/WatchedDerivation";

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
      : isQuarkyIon(subject) ? new IonSubject(subject)
         : isGetter(subject) ? new IonSubject(createWatchedDerivation(subject, !!retrack))
            : isObject(subject) ? subject  //non-ionized object
               : invalidSubject
}

function isMultiSubject(subject: AnyObject): subject is WatchSubjects {
   return MULTISUBJECT in subject;
}

const invalidSubject = {}

function isQuarkyIon(value: unknown): value is QuarkyIon {
   return hasQuark(value) && isIon(value);
}


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

   linkEffect(effect: Effect, phase: Phase, eager: boolean, initial?: boolean): void {
      const subjects = this.subjects;
      for (const subject of subjects) {
         if (!isWatchSubject(subject)) continue;
         subject.linkEffect(effect, phase, eager, initial)
      }
   }

   // unlinkEffect(effect: Effect, phase: string): void {
   //    const subjects = this.subjects;
   //    for (const subject of subjects) {
   //       if (!isWatchSubject(subject)) continue;
   //       subject.unlinkEffect(effect, phase)
   //    }
   // }

}


export function isIonizedIon(subject: unknown): subject is $AtomicIonState | $AtomicPionState {
   if (!hasQuark(subject)) return false;
   const quark = quarkOf(subject)
   return (isAtomicIonQuark(quark) || isAtomicPionQuark(quark)) && quark.ionized;
}

export function isGetter(value: unknown): value is () => any {
   return value instanceof Function && value.length === 0;
}

export interface WatchSubject {
   inert: boolean,
   trackedCall: () => unknown
   linkEffect(effect: Effect, phase: Phase, eager: boolean, initial?: boolean): void
   // unlinkEffect(effect: Effect, phase: string): void
}

/**
 * Watching ionized models will NOT track absorbed ions and derivations. 
 * To watch absorbed ions and derivations, use multisubject
 */
class IonizedModelSubject implements WatchSubject {
   inert: boolean = false
   private watchedAtom: Watched

   constructor(
      private model: IonizedModel,
   ) {
      this.watchedAtom = asWatched(quarkOf(model))
   }

   trackedCall() {
      return this.model
   }

   linkEffect(effect: Effect, phase: Phase, eager: boolean, initial: boolean = false) {
      linkEffectToAtom(this.watchedAtom, effect, phase, eager, initial)
   }

   // unlinkEffect(effect: Effect, phase: string) {
   //    this.watchedAtom.unlink(effect, phase)
   // }
}

type QuarkyIon = {
   (): unknown
   [QUARK]: { asCompound?: IonicCompound, inert: boolean } & Quark
}

/**
 * - relinks value to effect if value is ionized
 * - relinks derivation atoms to effect on every call if derivation ion
 */
class IonSubject implements WatchSubject {
   inert: boolean = false;

   private watchedAtoms: Watched[] = []
   private valueAtom?: Watched
   private quark: { asCompound?: IonicCompound, inert: boolean } & Quark

   constructor(
      private ion: QuarkyIon,
   ) {
      this.quark = quarkOf(ion)
   }

   private initialized = false;

   trackedCall() {
      if (this.initialized)
         return this.retrackedCall()

      this.initialized = true;

      const value = detachedCall(this.ion)
      const quark = this.quark;
      const compound = quark.asCompound

      this.watchedAtoms = compound ? compound.atoms.size ? toWatchedAtoms(compound.atoms) : (quark.inert = true, [])
         : !quark.inert && isWatchable(quark) ? [asWatched(quark)] : []

      if (isWatchableEntity(value)) {
         this.valueAtom = asWatched(quarkOf(value)) //TODO: need to add valueAtom to watchedAtoms
      }
      return value;
   }

   private retrackedCall() {
      const quark = this.quark
      const compound = quark.asCompound
      if (compound) this.effect.unlink()
      const value = detachedCall(this.ion)
      if (compound && compound.atoms.size) {
         linkEffectToAtoms(toWatchedAtoms(compound.atoms), this.effect, this.phase)
      }

      this.relinkValue(value)

      return value;
   }

   private effect!: Effect;
   private phase!: Phase;

   linkEffect(effect: Effect, phase: Phase, eager: boolean, initial: boolean = false) {
      this.effect = effect;
      this.phase = phase;
      linkEffectToAtoms(this.watchedAtoms, effect, phase, eager, initial)
      linkEffectToAtom(this.valueAtom, effect, phase, eager, initial)
   }

   // unlinkEffect(effect: Effect, phase: string) {
   //    unlinkEffect(this.watchedAtoms, effect, phase)
   //    this.valueAtom?.unlink(effect, phase)
   // }

   relinkValue(
      value: unknown,
   ) {
      const prevAtom = this.valueAtom;
      const atom = this.valueAtom = isWatchableEntity(value) ? asWatched(quarkOf(value)) : undefined

      if (atom === prevAtom)
         return;

      // relink effects
      if (prevAtom) {
         this.effect.unlink()
      }
      if (isWatchableEntity(value)) {
         asWatched(quarkOf(value)).link(this.effect, this.phase)
      }
   }
}


function linkEffectToAtoms(atoms: Watched[], effect: Effect, phase: Phase, eager: boolean = false, initial: boolean = false) {
   for (const atom of atoms) {
      linkEffectToAtom(atom, effect, phase, eager, initial)
   }
}

function linkEffectToAtom(atom: Watched | undefined, effect: Effect, phase: Phase, eager: boolean = false, initial: boolean = false) {
   if (!atom) return;
   atom.link(effect, phase)
   if (initial && eager) {
      $currentEffectCycle().scheduleEagerEffect(effect, phase)
   }
}


// function unlinkEffect(atoms: Watched[], effect: Effect, phase: string) {
//    for (const atom of atoms) {
//       atom.unlink(effect, phase)
//    }
// }

// function _scheduleEagerEffect(watchedAtom: Watched, effect: Effect, phase: string) {
//    if (phase === SYNC) {
//       watchedAtom.runSyncEffects()
//    }
//    else {
//       scheduleEagerEffect(effect, phase)
//    }
// }

function toWatchedAtoms(atoms: Set<Watchable>) {
   const watchedAtoms = [];
   for (const atom of atoms) {
      watchedAtoms.push(asWatched(atom))
   }
   return watchedAtoms;
}


export class IonicTaskSubject implements WatchSubject {
   inert: boolean = false;

   watchedAtoms: Watched[] = []

   constructor(
      private ionicEffect: {
         (): void;
         asCompound: IonicCompound;
      },
      private retrack: boolean
   ) { }

   private initialized = false

   trackedCall() {
      if (this.initialized) return this.retrackedCall()
      this.initialized = true;
      const ionicEffect = this.ionicEffect
      detachedCall(ionicEffect)
      this.watchedAtoms = toWatchedAtoms(ionicEffect.asCompound.atoms)
   }

   effect!: Effect
   phase!: Phase

   private retrackedCall() {
      if (!this.retrack) return this.ionicEffect()
      const ionicEffect = this.ionicEffect
      const effect = this.effect
      effect.unlink()
      detachedCall(ionicEffect)
      linkEffectToAtoms(toWatchedAtoms(ionicEffect.asCompound.atoms), effect, this.phase)
   }

   linkEffect(effect: Effect, phase: Phase, eager: boolean, initial?: boolean): void {
      this.effect = effect;
      this.phase = phase;
      linkEffectToAtoms(this.watchedAtoms, effect, phase, eager, initial)
   }

   // unlinkEffect(effect: Effect, phase: string): void {
   //    unlinkEffect(this.watchedAtoms, effect, phase)
   // }
}