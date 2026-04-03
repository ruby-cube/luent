import { $listen, Flask, getActiveFlask, getFlask, PausableListener, SustainedListenerOptions } from "@rue/flask";
import { Effect } from "./Effect";
import { asSubject, IonSubject, isSubject, Subject } from "./Subject";
import { AnyObject, Glass } from "@rue/types";
import { __DEV__unwrap } from "@rue/utils";
import { SimpleState } from "./State";
import { $currentCycle, getDefaultPhase, Phase, PRELUDE, SYNC } from "./RenderCycle";
import { dev, logAtoms } from "../debug/dev";
import { Traceable } from "../debug/Traceable";
import { Ion } from "../ion/Ion";
import { hasQuark, quarkOf } from "../abstract/Quark";
import { toValue } from "../ion/utils";


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
   preserve?: boolean;
   retrack?: boolean;
} & Glass<SustainedListenerOptions & WatchDebugOptions>

export type WatchDebugOptions = {
   devName?: string,
   'dev.logAtoms'?: boolean,
   'dev.traceTriggers'?: boolean
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
      public previous: S | undefined,
      public current: S,
      public eager: boolean
   ) { }
}

export type WatchSubjects = (Object | Ion)[]

export function watch<T>(subject: T, effect: EffectTask<T>, options: EffectOptions = {}): PausableListener {
   console.log('*** watching', subject)
   options.retrack = options.retrack ?? true;

   const target = asSubject(subject, options.retrack)
   target.asTraceable = new Traceable(options?.devName ?? 'watch' + subject)

   if (__DEV__ && options["dev.logAtoms"]) {
      const target = ion(() => subject(), {
         devName: options.devName
      })
      watch(target, () => {
         console.log('hi')
         logAtoms(quarkOf(target))
      }, {
         phase: options.phase,
         eager: true,
         once: options.once
      })
      //TODO: ionic proxy cases      
   }
   if (!isSubject(target)) { // plain object
      console.log('inert A')
      if (options?.eager) {
         scheduleEagerEffect(() =>
            effect(new StateChangeEvent(undefined, subject, true))
         , getPhase(options))
      }
      return InertWatcher()
   }

   const prevState = new SimpleState(target.getState()) // tracking

   if (!target.reactive) {
      if (options?.eager) {
         console.log('inert B')
         scheduleEagerEffect(() => 
            effect(new StateChangeEvent(undefined, prevState.get(), true))
         , getPhase(options))
      }
      return InertWatcher()
   }

   function wrappedEffect() {
      const newState = target.getState() // retracking
      // console.log('effect!!!', prevState.get(), newState)

      try {
         (<EffectTask>effect)(new StateChangeEvent(prevState.get(), newState, !!options.eager))
      }
      finally {
         options.eager = false;
         prevState.set(newState);
         // hasChanged = getHasChangedFn(options, prevState.get()) //accounts for ions whose value may change from ionized to not ionized
      }
   }
   wrappedEffect.__DEV__fn = effect

   return setUpWatcher(
      target,
      wrappedEffect,
      options,
   )
}

type Task = () => void

export function getPhase(options: undefined | EffectOptions): Phase {
   return options?.phase ?? getDefaultPhase()
}



export function sync<F>(fn: F): F {
   //@ts-expect-error
   fn.sync = true
   return fn
}


export function setUpWatcher(
   subject: Subject,
   task: Task,
   options: EffectOptions,
) {
   const phase = options.phase = getPhase(options)
   const eager = options.eager ?? false;
   // TODO: options.preserve means non-pausable watcher
   const preserve = options.preserve

   // task = maybePostcycleTask(task, phase)

   // if (eager) {
   //    scheduleEagerEffect(task, phase)
   // }
   if (options?.["dev.traceTriggers"]) {

   }


   return $listen(task, options || {}, {
      enroll(_task) {
         const effect = new Effect(_task, phase)
         effect.__DEV__fn = task.__DEV__fn
         subject.linkEffect(effect)
         if (eager) {
            scheduleEagerEffect(_task, phase)
         }
         return effect;
      },
      remove(effect: Effect) {
         effect.destroy()
      },
      pausable: true
   });
}


export function scheduleEagerEffect(task: Task, phase: Phase) {
   const cycle = $currentCycle()
   cycle.scheduleTask(task, phase)
   if (phase === SYNC) {
      cycle.runEffects(SYNC)
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






/**
 * Optimized barebones ion-only watch function. links effect to atoms and flask. No async context used.
 * @param ion 
 * @param render 
 * @param eager 
 * @returns 
 */
export function watchToRender<T>(ion: Ion<T>, render: (state: { current: T, previous: T, flask: Flask, eagerRun: boolean }) => void, flask: Flask = getActiveFlask(), eager: boolean = false) {
   // watch(ion, (e)=>render({current: e.current, previous: e.previous, flask: getActiveFlask()}), {phase: PRELUDE, eager})
   // return;
   const subject = new IonSubject(() => toValue(ion())) // toValue in case of mutable ion getter

   let prevState = subject.getState()

   if (!subject.reactive && !eager) {
      return;
   }

   let stale = false;
   let paused = false;

   const effect = new Effect(() => {
      if (paused) {
         stale = true;
         return;
      }
      stale = false;
      _render()
   }, PRELUDE)

   let eagerRun = eager;

   function _render() {
      const newState = subject.getState()
      render({ current: newState, previous: prevState, flask, eagerRun })
      eagerRun = false;
      prevState = newState;
   }

   if (eager) {
      scheduleEagerEffect(_render, PRELUDE)
   }

   subject.linkEffect(effect)

   flask?.onDiscard(/* listener.stop */() => {
      effect.destroy()
   });
   flask?.onDemount(/* listener.pause */() => {
      paused = true;
   });
   flask?.onRemount(/* listener.resume */() => {
      paused = false;
      if (stale) {
         effect.run?.()
      }
   });
}

export const RUN_EAGERLY = true;
