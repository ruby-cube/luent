import { AnyObject, Glass } from "@rue/types";
import { Watchable, Watched } from "./Watched";
import { $listen, ResumableListener, getActiveFlask, SustainedListenerOptions } from "@rue/flask";
import { detachedCall, IonicCompound, IonicCompoundMorph, untrackedCall } from "../ionic/IonicCompound";
import { $effectCycle, PHASE_ONE, SYNC } from "./EffectCycle";
import { createIonicEffect, IonicTask } from "../ionic/IonicEffect";
import { HasQuark, hasQuark, QUARK, quarkOf } from "../Quark";
import { Ion, isIon } from "../ion/ion";
import { createWatchedDerivation, isWatchedDerivation } from "../ionic/WatchedDerivation";
import { createMultisubjectIon, isMultisubjectIon } from "./MultiSubject";
import { isManagedDerivation } from "../ionic/DerivationIon";
import { isObject, isObjectLiteral } from "@rue/utils";
import { asCoreIon, isPionCapsule } from "../ionic/PionCapsule";
import { EffectLink } from "./EffectLink";
import { isIonizedModel } from "../ionized/ionize";
import { $AtomicIonState, isAtomicIon, isAtomicIonQuark } from "../ion/AtomicIon";
import { $AtomicPionState, isAtomicPionQuark } from "../ion/AtomicPion";
import { createWatchedIonizedIon } from "./WatchedIonizedIon";

export class ChangeEvent<S = unknown> {
   // trace?: string;
   constructor(
      public prevState: S,
      public state: S,
   ) { }
}


export type EffectOptions = {
   phase?: number;
   cycle?: 'current' | 'next'
   eager?: true;
   isEqual?: (prevState?: any, newState?: any) => boolean;
   retrack?: true;
} & Glass<SustainedListenerOptions>
// & WatchDebugOptions

export type Effect<T = unknown> = (event: ChangeEvent<SubjectValues<T>>) => void;

type SubjectValues<T> = T extends [() => infer R] ? R : T extends [infer O] ? O : MultiSubjectValues<T>;

type MultiSubjectValues<T> =
   T extends [infer A, infer B] ? [SubjectValue<A>, SubjectValue<B>]
   : T extends [infer A, infer B, infer C] ? [SubjectValue<A>, SubjectValue<B>, SubjectValue<C>]
   : T extends [infer A, infer B, infer C, infer D] ? [SubjectValue<A>, SubjectValue<B>, SubjectValue<C>, SubjectValues<D>]
   : T extends [infer A, infer B, infer C, infer D, infer E] ? [SubjectValue<A>, SubjectValue<B>, SubjectValue<C>, SubjectValue<D>, SubjectValue<E>]
   : T extends [infer A, infer B, infer C, infer D, infer E, infer F] ? [SubjectValue<A>, SubjectValue<B>, SubjectValue<C>, SubjectValue<D>, SubjectValue<E>, SubjectValue<F>]
   : T

type SubjectValue<T> = T extends () => infer R ? R : T


// Possible subjects
// ---
// plain function (potentially inert)
// ion (potentially inert/neutron) (should have a watch fn on quark)
// memoized ion
// 
// ionized model possibly with absorbed ions
// --
// plain array with all sorts of subjects
// --
// ionized collection





function InertWatcher() {
   function noOp() {
      return false;
   }
   return { // inert watch subjects
      stop: noOp,
      pause: noOp,
      resume: noOp,
   }
}

function getValue(subject: unknown) {

   if (isIon(subject)) {
      return getIonValue(subject)
   }
   return subject
}

function getIonValue(subject: Ion) {
   if (isManagedDerivation(subject)) // memoized
      return detachedCall(subject) // allows internal tracking, disables being tracked
   if (isMultisubjectIon(subject) || isWatchedDerivation(subject)) {
      return subject() // allow internal tracking, no need to detach because multisubject and watch derivations cannot be particles
   }
   // atomic ion/pion
   return untrackedCall(subject) // disables being tracked
}

function noReactivity(subject: AnyObject) {
   if (quarkOf(<HasQuark<{ inert: boolean }>>subject).inert) return true;
   return subject.asCompound && subject.asCompound.particles.length === 0;
}

type WatchSubjects = (Object | Ion)[]

export function watch<
   T extends WatchSubjects,
   P
>(effect: IonicTask<P>): ResumableListener
export function watch<
   T extends WatchSubjects,
   P
>(effect: IonicTask<P>, options: EffectOptions): ResumableListener
export function watch<
   T extends WatchSubjects,
   P
>(subject: T, effect: Effect<T>): ResumableListener
export function watch<
   T extends WatchSubjects,
   P
>(subject: T, effect: Effect<T>, options: EffectOptions): ResumableListener
export function watch<
   T extends WatchSubjects,
   P
>(...args: [...T, Effect<T>] | [...T, Effect<T>, EffectOptions]): ResumableListener
export function watch<
   T extends WatchSubjects,
   P
>(...args: [...T, Effect<T>, EffectOptions]): ResumableListener
export function watch<
   T extends WatchSubjects,
   P
>(...args: [IonicTask<P>] | [IonicTask<P>, EffectOptions] | [...T, Effect<T>] | [...T, Effect<T>, EffectOptions]): ResumableListener {
   if (args[0] instanceof Function && (args.length === 1 || args.length === 2 && isObjectLiteral(args[1]))) {
      return initIonicEffect(<IonicTask>args[0])
   }
   const lastArg = args.pop()
   const noOptions = lastArg instanceof Function
   const effect = lastArg instanceof Function ? lastArg : args.pop()
   const options = noOptions ? {} : lastArg as EffectOptions
   if (!effect || !(effect instanceof Function))
      throw new Error("Invalid input. Effect function must be last or second to last argument.")
   if (args.length === 0) throw new Error("Invalid input. No watch subjects")
   const isMultiSubject = args.length > 1;
   const _subject = isMultiSubject ? args : args[0]

   const retrack = !!(options?.retrack)

   let subject = normalizeSubject(_subject, isMultiSubject, retrack)

   if (!hasQuark(subject)) // plain object
      return InertWatcher()

   let prevState = getValue(subject); // this is where initial reactivity tracking happens (if derivation not already initialized) 

   if (noReactivity(subject)) {
      if (isIonizedModel(prevState)) {
         subject = prevState; // watch ionized model
      }
      else {
         return InertWatcher()
      }
   }

   const quark = quarkOf(<HasQuark>subject) as Watchable & IonicCompoundMorph
   const watchSubject = quark.watch()
   watchSubject.onDiscard(quark.unwatch)

   let eager: boolean | undefined = options?.eager
   const isEqual = options?.isEqual ?? isIonizedModel(prevState) ? () => false : isStrictlyEqual
   const phase = options?.phase ?? PHASE_ONE;



   function wrappedEffect() {
      const newState = getValue(subject)
      if (typeof newState === 'number')console.log('index? in wrappedEFfect', newState)
      if (!eager && isEqual(prevState, newState))
         return;

      eager = false;

      try {
         (<Effect>effect)(new ChangeEvent(prevState, newState))
      }
      finally {
         prevState = newState;
      }
   }

   if (eager) {
      scheduleEffectEagerly(wrappedEffect, phase)
   }

   return setUpWatcher(
      watchSubject,
      wrappedEffect,
      phase,
      options || {},
      quark.asCompound
   )
}

function normalizeSubject(_subject: unknown, isMultiSubject: boolean, retrack: boolean) {
   return isMultiSubject ? createMultisubjectIon(<WatchSubjects>_subject)
      : isIonizedIon(_subject) ? createWatchedIonizedIon(_subject)
         : isPionCapsule(_subject) ? asCoreIon(_subject)
            : hasQuark(_subject) ? _subject
               : isGetter(_subject) ? createWatchedDerivation(<() => unknown>_subject, retrack)
                  : isObject(_subject) ? _subject as AnyObject //non-ionized object
                     : null
}



function isIonizedIon(subject: unknown): subject is $AtomicIonState | $AtomicPionState {
   if (!hasQuark(subject)) return false;
   const quark = quarkOf(subject)
   return (isAtomicIonQuark(quark) || isAtomicPionQuark(quark)) && quark.ionized;
}


export function isGetter(value: unknown): value is () => any {
   return value instanceof Function && value.length === 0;
}

function isStrictlyEqual(oldState: unknown, newState: unknown) {
   return newState === oldState
}

type WrappedEffect = () => void

function scheduleEffectEagerly<T>(effect: WrappedEffect, phase: number) {
   if (phase === SYNC) {
      effect()
   }
   else {
      $effectCycle().scheduleEffect(new EffectLink(effect), phase)
   }
}

/**
 * Initializes ionic effect by running the effect and then watching its dependencies, re-running the effect 
 * when any of its dependencies change in state.
 * 
 * An ionic effect is essentially a watch subject and effect combined into one function.
 * As a watch subject, it can return state. As an effect it receives the previous state.
 * This is useful if state needs to be shared between effect runs.
 * In most cases, an ionic effect will be a simple void function that performs side effects.
 */
function initIonicEffect(effect: IonicTask, options?: EffectOptions) {
   const phase = options?.phase || PHASE_ONE;
   const retrack = options?.retrack || false;

   const wrappedEffect = createIonicEffect(effect, retrack)

   scheduleEffectEagerly(wrappedEffect, phase);

   return setUpWatcher(
      wrappedEffect.asWatched,
      wrappedEffect,
      phase,
      options || {},
      wrappedEffect.asCompound
   )
}


function setUpWatcher(
   subject: Watched,
   effect: WrappedEffect,
   phase: number,
   options: EffectOptions,
   compound?: IonicCompound //
) {
   const forNextCycle = options?.cycle === 'next';
   let dirty = false;
   const markDirty = new EffectLink(() => {
      dirty = true
   }, subject)
   let effectLink: EffectLink;

   return $listen(effect, options || {}, {
      enroll(task) {
         effectLink = new EffectLink(task, subject)
         subject.watch(effectLink, phase, forNextCycle)
      },
      remove() {
         subject.unwatch(effectLink, phase)
         if (compound)
            compound.untrackParticles()
      },
      pause() {
         subject.watch(markDirty, phase)
         return () => {
            subject.unwatch(markDirty, phase)
         }
      },
      resume(task) {
         subject.unwatch(markDirty, phase)
         if (dirty) {
            task()
            dirty = false;
         }
      }
   });
}



// watch(() => {

// }, { cycle: "current" })

// watch((event: ChangeEvent<number>) => {
//    event.prevState
//    return 9
// }, { eager: true })

// watch(() => 3, e => {
//    console.log(e.prevState, "llfll;klsflff")
// })

// watch(() => 3, () => 'hi', {frog: 'sir'}, e => {
//    console.log(e.state, "llfllff")
// })

// watch({ dog: 9 }, (e) => {
//    console.log('dookkr', e.prevState)
// })