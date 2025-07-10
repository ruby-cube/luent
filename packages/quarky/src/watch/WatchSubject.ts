import { AnyObject } from "@rue/types";
import { Effect } from "../effect-cycle/EffectQueue"
import { $AtomicIonState, isAtomicIonQuark } from "../ion/AtomicIon";
import { $AtomicPionState, isAtomicPionQuark } from "../ion/AtomicPion";
import { IonizedModel } from "../ionized/IonizedModel"
import { hasQuark, quarkOf } from "../Quark"
import { asWatched, Watched } from "./Watched"
import { isObject } from "@rue/utils";
import { isManagedDerivation } from "../ionic/DerivationIon";
import { Ionized, isIonizedModel } from "../ionized/ionize";
import { Ion, isIon } from "../ion/Ion";
import { asCoreIon, isPionCapsule } from "../ionic/PionCapsule";
import { WatchSubjects } from "./watch";


function asWatchSubject(subject: Ionized<object> | Ion<any> | WatchSubjects, retrack?: boolean): WatchSubject {
   // const retrack = options.retrack === undefined ? true : options.retrack
   const isMultiSubject = subject instanceof Array && !isIonizedModel(subject);

   return isMultiSubject ? createMultisubject(<WatchSubjects>subject)
      : isIonizedIon(subject) ? createWatchedIonizedIon(subject)
         : isPionCapsule(subject) ? new IonSubject(asCoreIon(subject))
            : isIon(subject) ? new IonSubject(subject)
               : isIonizedModel(subject) ? new IonizedModelSubject(subject)
                  : isManagedDerivation(subject) ? new DerivationIonSubject(subject)
                     : isGetter(subject) ? createWatchedDerivation(<() => unknown>subject, retrack)
                        : isObject(subject) ? subject as AnyObject //non-ionized object
                           : null

}



//TODO: ionized ions need to retrack its 'atoms' (i.e. the ionized model) and setup new links if the ionized model has changed...





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
   getValueAndAtoms: () => readonly [unknown, Watched[]]
   getValue: () => unknown
   linkEffect(effect: Effect, phase: string, eager: boolean, initial?: boolean): void
   unlinkEffect(effect: Effect, phase: string): void
}

class IonizedModelSubject implements WatchSubject {
   inert: boolean
   watchedAtoms: Watched[]

   constructor(
      private model: IonizedModel,
   ) {
      const quark = quarkOf(model)
      this.inert = false
      const watchedAtoms = this.watchedAtoms = [asWatched(quark)] //TODO: add absorbed ions


      const atoms = quark.trackAbsorbedIons(); //TODO: output the atom's quark
      if (atoms)
         for (const atom of atoms) {
            watchedAtoms.push(asWatchSubject(atom))
         }
   }

   getValueAndAtoms() {
      return [this.model as unknown, this.watchedAtoms] as const
   }

   getValue() {
      // retrack absorbed ions 
      // A) can watchedAtoms be an ionized model so that we can link/unlink effect when absorbed ions are reassigned? Or should reassigning absorbed ions be disallowed?

      return this.model
   }

   linkEffect(effect: Effect, phase: string, eager: boolean, initial: boolean = false) {
      linkEffect(this.watchedAtoms, effect, phase, eager, initial)
   }

   unlinkEffect(effect: Effect, phase: string) {
      unlinkEffect(this.watchedAtoms, effect, phase)
   }
}

class IonSubject implements WatchSubject {
   inert: boolean
   watchedAtoms: Watched[]

   constructor(
      private ion: Ion & HasQuark,
   ) {
      const quark = quarkOf(ion)
      this.inert = 'inert' in quark ? quark.inert : false
      this.watchedAtoms = [asWatched(quark)]
   }

   getValueAndAtoms() {
      return [this.ion() as unknown, this.watchedAtoms] as const
   }

   getValue() {
      return this.ion()
   }

   linkEffect(effect: Effect, phase: string, eager: boolean, initial: boolean = false) {
      linkEffect(this.watchedAtoms, effect, phase, eager, initial)
   }

   unlinkEffect(effect: Effect, phase: string) {
      unlinkEffect(this.watchedAtoms, effect, phase)
   }
}
