import { AnyObject } from "@rue/types";
import { Effect } from "../effect-cycle/EffectQueue"
import { $AtomicIonState, isAtomicIonQuark } from "../ion/AtomicIon";
import { $AtomicPionState, isAtomicPionQuark } from "../ion/AtomicPion";
import { IonizedModel } from "../ionized/IonizedModel"
import { hasQuark, QUARK, Quark, quarkOf } from "../Quark"
import { asWatchedAtom, isWatchable, isWatchableEntity, Watchable, WatchedAtom } from "./WatchedAtom"
import { isObject, noop } from "@rue/utils";
import { Ionized, isIonizedModel } from "../ionized/ionize";
import { Ion, isIon, toValue } from "../ion/Ion";
import { $currentOrNextCycle } from "../effect-cycle/ReactivitySystem";
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

export function isQuarkyIon(value: unknown): value is QuarkyIon {
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

   linkEffect(effect: Effect, eager: boolean): void {
      const subjects = this.subjects;
      for (const subject of subjects) {
         if (!isWatchSubject(subject)) continue;
         subject.linkEffect(effect, eager)
      }
   }
}


function isIonizedIon(subject: unknown): subject is $AtomicIonState | $AtomicPionState {
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
   linkEffect(effect: Effect, eager: boolean): void
}

/**
 * Watching ionized models will NOT track absorbed ions and derivations. 
 * To watch absorbed ions and derivations, use multisubject
 */
class IonizedModelSubject implements WatchSubject {
   inert: boolean = false
   private watchedAtom: WatchedAtom

   constructor(
      private model: IonizedModel,
   ) {
      this.watchedAtom = asWatchedAtom(quarkOf(model))
   }

   trackedCall() {
      return this.model
   }

   linkEffect(effect: Effect, eager: boolean) {
      linkEffectToAtom(this.watchedAtom, effect, eager)
   }
}

type QuarkyIon = {
   (): unknown
   [QUARK]: { asCompound?: IonicCompound, inert: boolean } & Quark
}



/**
 * - relinks value to effect if value is ionized
 * - relinks derivation atoms to effect on every call if derivation ion
 */
export class IonSubject implements WatchSubject {
   inert: boolean = false;

   private watchedAtoms: WatchedAtom[] = []
   private valueAtom?: WatchedAtom
   private quark: { asCompound?: IonicCompound, inert: boolean } & Quark

   // get pendingUpdates(){
   //    this.watchedAtoms.forEach((atom)=>{

   //    })
   //    this.valueAtom?.quark.pendingUpdate
   // } //NOTE: These may have many updates from different update calls

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
         : !quark.inert && isWatchable(quark) ? [asWatchedAtom(quark)] : []

      if (isWatchableEntity(value)) {
         this.valueAtom = asWatchedAtom(quarkOf(value)) //TODO: need to add valueAtom to watchedAtoms
      }
      return value;
   }

   private retrackedCall() {
      const quark = this.quark
      const compound = quark.asCompound
      if (compound) this.effect.unlink()
      const value = detachedCall(this.ion)
      if (compound && compound.atoms.size) {
         if (compound.atoms.size === 0) console.warn('WE LOST REACTIVITY')
         linkEffectToAtoms(toWatchedAtoms(compound.atoms), this.effect)
      }

      this.relinkValue(value)

      return value;
   }

   private effect!: Effect;

   linkEffect(effect: Effect, eager: boolean = false) {
      this.effect = effect;
      linkEffectToAtoms(this.watchedAtoms, effect, eager)
      linkEffectToAtom(this.valueAtom, effect, eager)
   }

   private relinkValue(
      value: unknown,
   ) {
      const prevAtom = this.valueAtom;
      const atom = this.valueAtom = isWatchableEntity(value) ? asWatchedAtom(quarkOf(value)) : undefined

      if (atom === prevAtom)
         return;

      // relink effects
      if (prevAtom) {
         this.effect.unlink()
      }
      if (isWatchableEntity(value)) {
         asWatchedAtom(quarkOf(value)).link(this.effect)
      }
   }
}


function linkEffectToAtoms(atoms: WatchedAtom[], effect: Effect, eager: boolean = false) {
   for (const atom of atoms) {
      linkEffectToAtom(atom, effect, eager)
   }
}

function linkEffectToAtom(atom: WatchedAtom | undefined, effect: Effect, eager: boolean = false) {
   if (!atom) return;
   effect.link(atom)
   if (eager) {
      $currentOrNextCycle().scheduleEffect(effect)
      if (effect.phase === SYNC){
         $currentOrNextCycle().runEffects(SYNC)
      }
   }
}

function toWatchedAtoms(atoms: Set<Watchable>) {
   const watchedAtoms = [];
   for (const atom of atoms) {
      watchedAtoms.push(asWatchedAtom(atom))
   }
   return watchedAtoms;
}


export class IonicTaskSubject implements WatchSubject {
   inert: boolean = false;

   watchedAtoms: WatchedAtom[] = []

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

   private retrackedCall() {
      if (!this.retrack) return this.ionicEffect()
      const ionicEffect = this.ionicEffect
      const effect = this.effect
      effect.unlink()
      detachedCall(ionicEffect)
      linkEffectToAtoms(toWatchedAtoms(ionicEffect.asCompound.atoms), effect)
   }

   linkEffect(effect: Effect, eager: boolean): void {
      this.effect = effect;
      linkEffectToAtoms(this.watchedAtoms, effect, eager)
   }
}