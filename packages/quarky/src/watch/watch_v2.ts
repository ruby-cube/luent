import { $listen, ResumableListener } from "@rue/flask";
import { Ion, isIon } from "../ion/Ion";
import { Ionized, isIonizedModel } from "../ionized/ionize";
import { EffectOptions, EffectTask, getPhase, WatchSubjects } from "./watch";
import { SYNC } from "../effect-cycle/EffectCycle";
import { Watched } from "./Watched";
import { Effect } from "../effect-cycle/EffectQueue";
import { scheduleEagerEffect } from "../ReactivitySystem";
import { WatchSubject } from "./WatchSubject";


export class StateChangeEvent<S = unknown> {
   // trace?: string;
   constructor(
      public previous: S, //TODO: change to prev
      public current: S, //TODO: change to current
      public eager: boolean
   ) { }
}


export function watch<
   T extends Ionized<object> | Ion<any> | WatchSubjects
>(subject: T, effect: EffectTask<T>, options: EffectOptions = {}): ResumableListener {


   const watchSubject = asWatchSubject(subject, options.retrack)
   if (options?.traceTriggers) {
      //TODO:
   }

   if (watchSubject.inert) { // plain object
      return InertWatcher()
   }

   let [prevState, atoms] = watchSubject.getValueAndAtoms(); // this is where initial reactivity tracking happens (if derivation not already initialized) 

   if (!atoms.length) {
      return InertWatcher()
   }

   let hasChanged = getHasChangedFn(options, prevState)

   function wrappedEffect() {
      const newState = watchSubject.getValue() // retracking happens here //TODO: segregate this call from the actual effect to prevent long derivations from blocking renders
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
      options,
   )
}

type Task = () => void

export function setUpWatcher(
   subject: WatchSubject,
   effect: Task,
   options: EffectOptions,
) {
   const phase = options.phase = getPhase(options)
   const eager = options.eager ?? false;

   let paused = false;

   function pausableEffect() { //TODO: can i get rid of this extra wrap?
      if (paused) return;
      return effect()
   }

   return $listen(pausableEffect, options || {}, {
      enroll(task) {
         const effect = new Effect(task)
         subject.linkEffect(effect, phase, eager, true)
         return effect;
      },
      remove(effect) {
         subject.unlinkEffect(effect, phase)
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

function linkEffect(atoms: Watched[], effect: Effect, phase: string, eager: boolean = false, initial: boolean = false) {
   for (const atom of atoms) {
      atom.link(effect, phase)
      if (initial && eager) {
         _scheduleEagerEffect(atom, effect, phase)
      }
   }
}

function unlinkEffect(atoms: Watched[], effect: Effect, phase: string) {
   for (const atom of atoms) {
      atom.unlink(effect, phase)
   }
}

function _scheduleEagerEffect(watchedAtom: Watched, effect: Effect, phase: string) {
   if (phase === SYNC) {
      watchedAtom.runSyncEffects()
   }
   else {
      scheduleEagerEffect(effect, phase)
   }
}

function isInertSubject() {

}

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

function getHasChangedFn(options: EffectOptions | undefined, state: unknown) {
   return options?.hasChanged ?? isIonizedModel(state) ? always : notStrictlyEqual
}

function always() {
   return true
}

function notStrictlyEqual(oldState: unknown, newState: unknown) {
   return newState !== oldState
}