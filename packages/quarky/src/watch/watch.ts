import { AnyObject } from "@rue/types";
import { Watchable, Watched } from "./Watched";
import { $listen, ResumableListener, getActiveFlask, SustainedListenerOptions } from "@rue/flask";
import { detachedCall, IonicCompound, MaybeIonicCompound, untrackedCall } from "../ionic/IonicCompound";
import { Phase, useEffectCycle } from "./EffectCycle";
import { createIonicEffect, IonicTask } from "../ionic/IonicEffect";
import { hasQuarks, QUARKS, quarksOf } from "../Quarks";
import { Ion, isIon } from "../ion/Ion";
import { createWatchedDerivation } from "../ionic/WatchedDerivation";
import { createMultiSubject } from "./MultiSubject";
import { isManagedDerivation } from "../ionic/DerivationIon";
import { isObjectLiteral } from "@rue/utils";
import { asCoreIon, isGetterIon } from "../ionized/GetterPion";

// export class ChangeEvent<S> {
//    trace?: string;
//    constructor(
//       public subject: S,
//       public newState?: S extends () => infer T ? T : S,
//       public oldState?: S extends () => infer T ? T : S,
//    ) { }
// }


export type EffectOptions = {
   phase?: Phase;
   cycle?: 'current' | 'next'
   eager?: true;
   isEqual?: (prevState?: any, newState?: any) => boolean;
   retrack?: true;
} & SustainedListenerOptions
// & WatchDebugOptions

export type Effect<T = unknown> = (prevState: SubjectValues<T>) => void;

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
// ion (potentially inert/neutron) (should have a watch fn on quarks)
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
   if (isManagedDerivation(subject))
      return detachedCall(subject)
   if (isWatchedDerivation(subject) || isGetterIon(subject)) {
      const compound = new IonicCompound()
      return trackedCall(subject)
   }
   if (isIon(subject)) {
      untrackedCall(subject) // why untracked? we don't want 
   }
   else {
      subject
   }
}

function noReactivity(subject: AnyObject) {
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
   //TODO: retrack WatchedDerivations when necessary
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

   const subject = isMultiSubject ? createMultiSubject(<WatchSubjects>_subject)
      : isGetterIon(_subject) ? asCoreIon(_subject)
         : hasQuarks(_subject) ? _subject
            : _subject instanceof Function ? createWatchedDerivation(<() => unknown>_subject, retrack)
               : _subject as AnyObject //non-ionized object

   if (!hasQuarks(subject) || (<{ inert: boolean }>quarksOf(subject)).inert)
      return InertWatcher()

   const quarks = quarksOf(subject) as Watchable & MaybeIonicCompound
   const watchSubject = quarks.watch()
   watchSubject.onUnwatched(quarks.unwatch)

   let eager: boolean | undefined = options?.eager
   const isEqual = options?.isEqual ?? isStrictlyEqual
   const phase = options?.phase ?? Phase.BEFORE_RENDER

   let prevState = getValue(subject); // this is where initial tracking happens if derivation not already initialized 

   if (noReactivity(subject)) return InertWatcher()

   function wrappedEffect() {
      const newState = getValue(subject)

      if (isEqual(prevState, newState))
         return;

      eager = false;

      try {
         (<Effect>effect)(prevState)
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
      quarks.asCompound
   )
}

function isStrictlyEqual(oldState: unknown, newState: unknown) {
   return newState === oldState
}

type WrappedEffect = () => void

function scheduleEffectEagerly<T>(effect: WrappedEffect, phase: Phase) {
   if (phase === Phase.SYNC) {
      effect()
   }
   else useEffectCycle().scheduleTask(effect, phase)
}


export function initIonicEffect(effect: IonicTask, options?: EffectOptions) { //NOTE: an effect is essentially a derived ion and effect combined into one function
   const phase = options?.phase || Phase.BEFORE_RENDER;
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
   phase: Phase,
   options: EffectOptions,
   compound?: IonicCompound //
) {
   let wrappedEffect: () => void;
   const forNextCycle = options?.cycle === 'next';
   let dirty = false;
   function markDirty() {
      dirty = true;
   }
   return $listen(effect, options || {}, {
      enroll(_effect) {
         wrappedEffect = _effect;
         subject.watch(_effect, phase, forNextCycle)
      },
      remove(_effect) {
         subject.unwatch(_effect, phase)
         if (compound)
            compound.untrackParticles()
      },
      pause() {
         subject.watch(markDirty, phase)
         return () => {
            subject.unwatch(markDirty, phase)
         }
      },
      resume() {
         subject.unwatch(markDirty, phase)
         if (dirty) {
            wrappedEffect()
            dirty = false;
         }
      }
   });
}



// watch(() => {

// }, { cycle: "current" })

// watch((prevState?: number) => {
//    return 9
// }, { eager: true })

// watch(() => 3, prev => {
//    console.log(prev, "llfll;klsflff")
// })

// watch(() => 3, () => 'hi', {frog: 'sir'}, prev => {
//    console.log(prev, "llfllff")
// })

// watch({ dog: 9 }, (prev) => {
//    console.log('dookkr', prev)
// })