import { AnyObject, Glass } from "@rue/types";
import { asWatched, Watchable, Watched } from "./Watched";
import { $listen, ResumableListener, getActiveFlask, SustainedListenerOptions } from "@rue/flask";
import { detachedCall, IonicCompound, IonicCompoundMorph, untrackedCall } from "../ionic/IonicCompound";
import { SYNC } from "../effect-cycle/EffectCycle";
import { HasQuark, hasQuark, QUARK, quarkOf } from "../Quark";
import { Ion, isIon } from "../ion/Ion";
import { createWatchedDerivation, isWatchedDerivation } from "../ionic/WatchedDerivation";
import { createMultisubjectIon, isMultisubjectIon } from "./MultiSubject";
import { isObject, isObjectLiteral } from "@rue/utils";
import { asCoreIon, isPionCapsule } from "../ionic/PionCapsule";
import { Ionized, isIonizedModel } from "../ionized/ionize";
import { $AtomicIonState, isAtomicIon, isAtomicIonQuark } from "../ion/AtomicIon";
import { $AtomicPionState, isAtomicPionQuark } from "../ion/AtomicPion";
import { createWatchedIonizedIon } from "./IonizedIon";
import { getDefaultPhase, getEffectCycleManager, scheduleEagerEffect } from "../ReactivitySystem";
import { Effect } from "../effect-cycle/EffectQueue";
import { runSyncEffects, scheduleEagerSyncEffect } from "../effect-cycle/SyncEffects";

export class StateChangeEvent<S = unknown> {
   // trace?: string;
   constructor(
      public previous: S, //TODO: change to prev
      public current: S, //TODO: change to current
      public eager: boolean
   ) { }
}

// watch($user, ({ current: user }) => {
//    if (!user) {
//       router.navigate('Welcome')
//    }
// })

/**
 * Default values:
 * 
 * phase: 1
 * eager: false
 * retrack: true
 * cycle: 'current'
 * hasChanged: a !== b
 */
export type EffectOptions = {
   phase?: string;
   sync?: boolean;
   cycle?: 'current' | 'next'
   eager?: boolean;
   retrack?: boolean;
   hasChanged?: (prevState?: any, newState?: any) => boolean;
} & Glass<SustainedListenerOptions & WatchDebugOptions>

export type WatchDebugOptions = {
   logAtoms?: boolean,
   traceTriggers?: boolean
}

export type EffectTask<T = unknown> = (event: StateChangeEvent<SubjectValues<T>>) => void;

type SubjectValues<T> = [T] extends [() => infer R] ? R : [T] extends [infer O] ? O : MultiSubjectValues<T>;

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
   if (isMultisubjectIon(subject) || isWatchedDerivation(subject)) {
      return subject() // allow internal tracking, no need to detach because multisubject and watch derivations cannot be particles
   }
   // if (isManagedDerivation(subject)) // memoized
   // atomic ion/pion
   return detachedCall(subject) // allows internal tracking, disables being tracked
   // return untrackedCall(subject) // disables being tracked
}

function noReactivity(subject: HasQuark) {
   const quark = quarkOf(subject)
   if (quark.inert) return true;
   return quark.asCompound && quark.asCompound.particles.length === 0; //TODO: apply this only to derivations, not ionized models?
}

export type WatchSubjects = (Object | Ion)[]

// export function watch<
//    T extends WatchSubjects,
//    P
// >(effect: IonicTask<P>): ResumableListener
// export function watch<
//    T extends WatchSubjects,
//    P
// >(effect: IonicTask<P>, options: EffectOptions): ResumableListener

export function watch<
   T extends Ionized<object> | Ion<any> | WatchSubjects,
   P
>(_subject: T, effect: EffectTask<T>, options: EffectOptions = {}): ResumableListener {
   // if (args[0] instanceof Function && (args.length === 1 || args.length === 2 && isObjectLiteral(args[1]))) {
   //    return initIonicEffect(<IonicTask>args[0], <EffectOptions>args[1])
   // }
   // const lastArg = args.pop()
   // const noOptions = lastArg instanceof Function
   // const effect = lastArg instanceof Function ? lastArg : args.pop()
   // const options = noOptions ? {} : { ...lastArg } as EffectOptions
   const phase = options.phase = getPhase(options)
   if (!effect || !(effect instanceof Function))
      throw new Error("Invalid input. Effect function must be last or second to last argument.")
   const isMultiSubject = _subject instanceof Array && !isIonizedModel(_subject);

   const retrack = options.retrack === undefined ? true : options.retrack

   let subject = normalizeSubject(_subject, isMultiSubject, retrack)
   if (options?.traceTriggers) {
      //TODO:
   }

   if (!hasQuark(subject)) {// plain object
      return InertWatcher()
   }

   let prevState = getValue(subject); // this is where initial reactivity tracking happens (if derivation not already initialized) 
   console.log('watch A', prevState)
   if (noReactivity(subject)) {
      console.log('watch X', prevState)
      // if (isIonizedModel(prevState)) {
      //    subject = prevState; // watch ionized model
      // }
      // else {
      return InertWatcher()
      // }
   }

   const quark = quarkOf(<HasQuark>subject) as Watchable & IonicCompoundMorph
   const watchSubject = asWatched(quark)

   let hasChanged = getHasChangedFn(options, prevState)


   function wrappedEffect() {
      const newState = getValue(subject)
      if (!options.eager && !hasChanged(prevState, newState)) {
         return;
      }

      try {
         (<EffectTask>effect)(new StateChangeEvent(prevState, newState, !!options.eager))
      }
      finally {
         options.eager = false;
         prevState = newState;
         hasChanged = getHasChangedFn(options, prevState) //accounts for ions whose value may change from ionized to not ionized
      }
   }
   wrappedEffect.__DEV__effect = effect

   return setUpWatcher(
      watchSubject,
      wrappedEffect,
      phase,
      options,
      !hasQuark(_subject) ? quark.asCompound : undefined // only pass terminal compounds
   )
}

function getHasChangedFn(options: EffectOptions | undefined, state: unknown) {
   return options?.hasChanged ?? isIonizedModel(state) ? always : notStrictlyEqual
}

function always() {
   return true;
}

export function getPhase(options: undefined | EffectOptions) {
   return options?.phase ?? (options?.sync ? SYNC : getDefaultPhase())
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



export function isIonizedIon(subject: unknown): subject is $AtomicIonState | $AtomicPionState {
   if (!hasQuark(subject)) return false;
   const quark = quarkOf(subject)
   return (isAtomicIonQuark(quark) || isAtomicPionQuark(quark)) && quark.ionized;
}


export function isGetter(value: unknown): value is () => any {
   return value instanceof Function && value.length === 0;
}

function notStrictlyEqual(oldState: unknown, newState: unknown) {
   return newState !== oldState
}

type Task = () => void



/**
 * Initializes ionic effect by running the effect and then watching its dependencies, re-running the effect 
 * when any of its dependencies change in state.
 * 
 * An ionic effect is essentially a watch subject and effect combined into one function.
 * As a watch subject, it can return state. As an effect it receives the previous state.
 * This is useful if state needs to be shared between effect runs.
 * In most cases, an ionic effect will be a simple void function that performs side effects.
 */
// function initIonicEffect(effect: IonicTask, options?: EffectOptions) {
//    const phase = options?.phase ?? DEFAULT_PHASE;
//    const retrack = options?.retrack ?? false;

//    const wrappedEffect = createIonicEffect(effect, retrack)

//    scheduleEffectEagerly(wrappedEffect, phase);

//    return setUpWatcher(
//       wrappedEffect.asWatched,
//       wrappedEffect,
//       phase,
//       options || {},
//       wrappedEffect.asCompound
//    )
// }


export function setUpWatcher(
   subject: Watched, //TODO: if we get rid of particles, this would have to be Watched[], and we would link the effect to each subject
   effectTask: Task,
   phase: string,
   options: EffectOptions,
   compound?: IonicCompound //
) {
   let paused = false;

   function pausableEffect() {
      if (paused) return;
      return effectTask()
   }

   return $listen(pausableEffect, options || {}, {
      enroll(task) {
         const effect = new Effect(task)
         // ORDER A: runs eagerly but not as an effect
         subject.link(effect, phase)
         if (options.eager) {
            _scheduleEagerEffect(subject, effect, phase)
         }
         return effect;
      },
      remove(effectLink) {
         subject.unlink(effectLink, phase)
         if (compound)
            compound.untrackParticles()
      },
      pause() {
         paused = true;
      },
      resume(task) {
         paused = false;
         task()
      }
   });
}

function _scheduleEagerEffect(subject: Watched, effect: Effect, phase: string) {
   if (phase === SYNC) {
      const atom = subject.effects.get(phase)
      atom?.runEffects(new Set())
      // scheduleEagerSyncEffect(effect);
      // runSyncEffects()
   }
   else {
      scheduleEagerEffect(effect, phase)
   }
}

// watch(() => {

// }, { cycle: "current" })

// watch((event: StateChangeEvent<number>) => {
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