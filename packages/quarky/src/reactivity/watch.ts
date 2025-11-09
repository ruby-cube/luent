import { $listen, PausableListener, SustainedListenerOptions } from "@rue/flask";
import { Ion, isIon } from "../ion/Ion";
import { Ionized, isIonicProxy } from "../ionic/ionize";
import { createOneoff, Effect, PhaseTask } from "./EffectQueue";
import { asWatchedSubstance, isWatchedSubstance, WatchedSubstance } from "./Substance";
import { Glass } from "@rue/types";
import { __DEV__unwrap } from "@rue/utils";
import { SimpleState } from "./State";
import { $currentCycle, getAdjustedPhase, getDefaultPhase, maybePostcycleTask, Phase, SYNC } from "./EffectCycle";


// watch(list.$length, list.$couch, sync(() => {
//    doSomething(prevList)
// }))

// watch(multisubstance(list.$length, list.$couch), sync(() => {
//    doSomething(prevList)
// }))


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
   phase?: Phase;
   eager?: boolean;
   preserve?: boolean;
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

export class StateChangeEvent<S = unknown> {
   // trace?: string;
   constructor(
      public previous: S, // TODO: change to prev
      public current: S, // TODO: change to current
      public eager: boolean
   ) { }
}

export type WatchSubjects = (Object | Ion)[]

export function watch<
   T extends Ionized<object> | Ion<any> | WatchSubjects
>(subject: T, effect: EffectTask<T>, options: EffectOptions = {}): PausableListener {

   options.retrack = options.retrack ?? true;

   const watchSubject = asWatchedSubstance(subject, options.retrack, Boolean(options.once))
   if (options?.traceTriggers) {
      // TODO:
   }

   if (!isWatchedSubstance(watchSubject)) { // plain object
      return InertWatcher()
   }

   const prevState = new SimpleState(watchSubject.getValue())

   // let prevState = watchSubject.getValue(); // this is where initial reactivity tracking happens (if derivation not already initialized) 

   if (!watchSubject.reactive) {
      return InertWatcher()
   }

   let hasChanged = getHasChangedFn(options, prevState)

   function wrappedEffect() {
      const newState = watchSubject.getValue() // retracking happens here // TODO: segregate this call from the actual effect to prevent long derivations from blocking renders
      if (!options.eager && !hasChanged(prevState.get(), newState)) {
         return;
      }

      try {
         (<EffectTask>effect)(new StateChangeEvent(prevState.get(), newState, !!options.eager))
      }
      finally {
         options.eager = false;
         prevState.set(newState);
         hasChanged = getHasChangedFn(options, prevState.get()) //accounts for ions whose value may change from ionized to not ionized
      }
   }
   wrappedEffect.__DEV__fn = effect

   return setUpWatcher(
      watchSubject,
      wrappedEffect,
      options,
   )
}

type Task = () => void

export function getPhase(options: undefined | EffectOptions): Phase {
   const phase = options?.phase ?? getDefaultPhase()
   return getAdjustedPhase(phase)
}



export function sync<F>(fn: F): F {
   //@ts-expect-error
   fn.sync = true
   return fn
}


export function setUpWatcher(
   subject: WatchedSubstance,
   task: Task,
   options: EffectOptions,
) {
   const phase = options.phase = getPhase(options)
   const eager = options.eager ?? false;
   // TODO: options.preserve means non-pausable watcher
   const preserve = options.preserve

   // task = maybePostcycleTask(task, phase)

   if (eager) {
      scheduleEagerEffect(task, phase)
   }

   return $listen(task, options || {}, {
      enroll(_task) {
         const effect = new Effect(_task, phase)
         subject.linkEffect(effect)
         return effect;
      },
      remove(effect: Effect) {
         effect.destroy()
      },
      pausable: true
   });
}


export function scheduleEagerEffect(task: Task, phase: Phase) {
   // const eagerEffect = createOneoff(task, phase)
   const cycle = $currentCycle()
   cycle.scheduleTask(new PhaseTask(task, phase))
   if (phase === SYNC) {
      cycle.runSyncEffects()
   }
}





export function InertWatcher() {
   function noOp() {
      return false;
   }
   return { // inert watch subjects
      stop: noOp,
      pause: noOp,
      resume: noOp,
   }
}

function getHasChangedFn(options: EffectOptions | undefined, state: unknown) {
   return options?.hasChanged ?? isIonicProxy(state) ? always : notStrictlyEqual
}

function always() {
   return true
}

function notStrictlyEqual(oldState: unknown, newState: unknown) {
   return newState !== oldState
}