import { AnyObject } from "@rue/types";
import { asWatched, Watchable, Watched } from "./Watched";
import { $listen, ResumableListener, getActiveFlask, SustainedListenerOptions } from "@rue/flask";
import { detachedCall, IonicCompound, MaybeIonicCompound } from "../ionic/IonicCompound";
import { getCurrentRenderCycle, Phase, useRenderCycle } from "./TaskCycle";
import { WatchDebugOptions } from "./debug";
import { ionize, IonizedModel, isIonizedModel, toRaw, } from "../ionized/ionize";
import { areEqual } from "./areEqual";
import { createIonicEffect, TerminalCompound } from "../ionic/IonicEffect";
import { AtomicIon, isAtomicIon } from "../ion/AtomicIon";
import { asAtom } from "../compound/Atom";
import { isPropIon, PropIon } from "../ionized/PrimaryPion";
import { toValue } from "../ion/toIons";
import { ChangeEvent } from "./ChangeEvent";
import { QUARKS, quarksOf } from "../Quarks";
import { Ion, isIon } from "../ion/Ion";
import { isMemoizedIon } from "../ionic/MemoizedIon";
import { untrackedCall } from "../ionic/x_DependencyTracker";
import { createWatchedDerivation } from "./WatchedDerivation";
import { isFunction, noop } from "@rue/utils";


type RenderCycleOptions = {
   phase?: Phase;
   cycle?: 'current' | 'next'
}

export type WatchOptions = {
   // deep?: boolean;
   eager?: true;
   stateChange?: boolean;
   // isEqual?: (oldValue?: any, newValue?: any) => boolean;
   // retrack?: boolean;
} & RenderCycleOptions & SustainedListenerOptions & WatchDebugOptions

export type EffectOptions = {
   retrack?: true;
   // only?: (boolean | AnyObject | Ion)[];
   // also?: AnyObject[]
} & RenderCycleOptions & SustainedListenerOptions & WatchDebugOptions



export type MutationRecord = {
   target: AnyObject | AtomicIon | PropIon,
   op: string,
   args: any[],
   output: any,
   preopData?: any
}


export type ChangeHandler<T = any> = (event: ChangeEvent<T>) => void

type Effect = () => void




// manages nested watch calls to prevent infinite loops
// let isRunningEffect = false;

// export function runEffect(effect: Effect) {
//     isRunningEffect = true;
//     effect()
//     isRunningEffect = false;
// }

// function shouldScheduleForNextCycle() {
//     return isRunningEffect;
// }


let currentWatchSubject: DerivedIon | AtomicIon | AnyObject | undefined // prevents infinite loops for synchronous effects that set ions

export function isCurrentWatchSubject(atom: AtomicIon | PropIon) {
   if (!currentWatchSubject) return false;
   if (currentWatchSubject === atom) return true;
   if (isDerivedIon(currentWatchSubject)) {
      return quarksOf(currentWatchSubject).atoms.has(asAtom(atom))
   }
   if (isIonizedModel(currentWatchSubject)) {
      if (isPropIon(atom)) {
         return quarksOf(atom).model === currentWatchSubject;
      }
      //TODO: what about absorbed ions?
   }

}

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

/**
 * Create compounds if needed
 * @param subject 
 * @returns 
 */
function normalizeSubject(subject: unknown): { [QUARKS]: Watchable } {
   if (isAtomicIon(subject)) {
      return subject;
   }
   if (isMemoizedIon(subject)) {
      return subject;
   }
   if (isPropIon(subject)) {
      quarksOf(subject).watch()
      return subject;
   }
   if (isMultiSubject) {
      return createMultiSubject(subject)
   }
   if (isGetter(subject)) {
      return createWatchedDerivation(subject)
   }
   if (isIonizedModel(subject)) {
      const compound = asIonizedCompound(quarksOf(subject)) //
      compound.trackAbsorbedIons()
      return subject;
   }
   throw new Error("invalid input")
}

function isGetter(value: unknown): value is () => any {
   return value instanceof Function && value.length === 0;
}

function createMultiSubject(subjects: unknown[] & AnyObject) {
   const quarks = {
      asCompound: undefined as unknown as TerminalCompound,
      asWatched: undefined as unknown as Watched
   }
   const compound: TerminalCompound = new TerminalCompound(quarks)
   quarks.asCompound = compound;
   quarks.asWatched = new Watched(quarks)

   let fn = initialize
   let getterFn = (subject: Ion) => compound.trackedCall(subject)
   let absorbedFn = (subject: IonizedModel) => {
      compound.track(subject)
      maybeInitializeIonizedCompound(subject)
   }
   function $subjects() {
      return fn()
   }
   $subjects[QUARKS] = quarks

   function initialize() {
      try {
         return getValues()
      }
      finally {
         getterFn = (subject: Ion) => subject()
         absorbedFn = noop
         fn = getValues;
      }
   }

   function getValues() {
      const values: unknown[] = []
      for (const subject of subjects) {
         if (isGetter(subject)) {
            values.push(getterFn(subject))
         }
         if (isIonizedModel(subject)) {
            absorbedFn(subject)
            values.push(subject)
         }
      }
   }

   return $subjects;
}

function maybeInitializeIonizedCompound(subject: AnyObject) {
   const quarks = quarksOf(subject)
   if (!quarks.asCompound) {
      const ionizedCompound = asIonizedCompound(quarksOf(subject))
      ionizedCompound.collectAbsorbedIons(subject) //TODO: but only if not initialized already...
   }
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

let currentEffect: Function | undefined;


function getValue(subject: unknown) {
   if (isMemoizedIon(subject))
      detachedCall(subject)
   else if (isDerivation(subject))
      subject() // allows initial tracking
   else if (isIon) {
      untrackedCall(subject)
   }
   else
      subject
}


//NOTE: I have decided watch should NOT handle ions that return ionized models together. Dev should handle them with separate watchers
// However, For($list) will handle this for the devs

// export function watch<T extends AnyIon | ReactiveGet>(subject: T, effect: T extends () => infer R ? ChangeHandler<R> : never, options?: WatchOptions): ResumableListener
// export function watch<T extends IonizedModel>(subject: T, effect: MutationEffect<T>, options?: WatchOptions): ResumableListener
// export function watch<T>(subject: T, effect: ChangeHandler<T>, options?: WatchOptions): ResumableListener {
export function watch<T extends any[]>(...args: [...T, ChangeHandler<T>] | [...T, ChangeHandler<T>, WatchOptions]): ResumableListener {
   const lastArg = args.pop()
   const noOptions = lastArg instanceof Function
   const effect = lastArg instanceof Function ? lastArg : args.pop()
   const options = noOptions ? {} : lastArg;
   if (!(effect instanceof Function)) throw new Error("Invalid input. Effect function must be last or second to last argument.")
   if (args.length === 0) throw new Error("Invalid input. No watch subjects")
   const isMultiSubject = args.length > 1;
   const subject = isMultiSubject ? args : args[0]

   if (isNeutron(subject)) {
      return InertWatcher()
   }
   if (isIonizedModel(subject)) {
      return watchModel(subject, effect, options)
   }
   if (isMultiSubject) {
      return watchMulti(subject, effect, options)
   }
   if (isMemoized(subject)) {
      return watchMemoized(subject, effect, options)
   }
   if (isAtomic(subject)) {

   }

   let eager: boolean | undefined = options?.eager
   const watchStateChange = options?.stateChange === false ? false : true;
   const phase = options?.phase ?? Phase.BEFORE_RENDER

   const _subject = normalizeSubject(subject)
   const watched = asWatched(quarksOf(_subject))
   // const _watchSubject = isMultiSubject ? watchSubjects : watchSubjects[0];
   // const ionicDerivations = isMultiSubject ? getIonicDerivations(subject, subjects) : subject instanceof Function ? [quarksOf(subject0) as IonicCompound] : undefined

   let oldValue: T;
   try {
      oldValue = getValue(_subject);
      // isMultiSubject ? getValues(subjects) : toValue(subject0)  // if atomic ion, need untrackedCall()
      // This is when memoized is initialized if not already //QUESTION: How to I prevent memo from being tracked as an atom while also letting it track its atoms
   }
   catch (err) {
      if (err instanceof Object && 'cause' in err && err.cause === 'no dependencies') {
         if (__DEV__) console.warn('inert watcher', effect)
         return InertWatcher()
      }
   }

   let prevCycle: any;
   function changeHandler() {
      const currentCycle = $currentCycle()
      if (currentCycle === prevCycle) {
         if (triggeredByItself()) // how do we know?
            return; // prevent infinite loops for "synchronous" effects, assumes effects are never nested
         else {
            rescheduleForNextCycle()
            return;
         }
      }
      prevCycle = currentCycle;

      const newValue = isMultiSubject ? getValues(subjects) : toValue(subject0) // This is when retracking happens

      if (watchStateChange && (!eager && (isMultiSubject && noChanges(subjects, newValue, oldValue)
         || isIon(subject0) && noChange(newValue, oldValue)
         || isIonizedModel(subject) && noMutations(subject)))
      )
         return;
      eager = false;

      try {
         effect(new ChangeEvent(subject, newValue, oldValue, getMutations(subjects)))
      }
      finally {
         currentEffect = undefined;
         oldValue = newValue;
      }
   }

   if (eager) {
      scheduleEffectEagerly(changeHandler, phase)
   }

   return setUpWatcher(
      watched,
      changeHandler,
      phase,
      options || {},
      quarksOf(_subject).asCompound
   )
}



function noChange(newValue: any, oldValue: any) {
   return areEqual(toRaw(newValue), toRaw(oldValue))
}

function noChanges(subjects: any[], newValues: any[], oldValues: any[]) {
   for (let i = 0; i < subjects.length; i++) {
      if (isIon(subjects[i])) {
         if (!noChange(newValues[i], newValues[i])) {
            return false;
         }
      }
      else if (isIonizedModel(subjects[i])) {
         if (!noMutations(subjects[i])) {
            return false;
         }
      }
   }
   return true;
}

function noMutations(model: AnyObject) {
   //TODO: 
   return false;
}

//TODO: Figure out what is the best format to use. Should mutations be in order of mutation? or organized by mutation target?
function getMutations(subjects: (AnyIon | AnyObject)[]) {
   //FIX: Temporary
   return []
   for (const subject of subjects) {
      const mutations = getCurrentRenderCycle()?.getOps(subject)
      if (!mutations) throw new Error("No mutations :(")
      return mutations //FIX: temporary
   }
   return []
}


// function watchReactiveModel<T extends IonizedModel>(subject: T, effect: MutationEffect<T>, options: WatchOptions) {
//     if (!isIonizedModel(subject)) {
//         console.warn(`Watching non-reactive object. Is this intentional?`)
//         return { stop: noop };
//     }
//     const eager = options?.eager
//     const phase = options?.phase || Phase.BEFORE_RENDER
//     // const deep = options?.deep

//     const watchSubject = asWatched(subject);

//     quarksOf(subject).trackAbsorbedIons()

//     const $activeEffect = ref(undefined) as AtomicIon<ThisEffect | undefined>

//     function mutationEffect() {
//         const mutations = getCurrentRenderCycle()?.getOps(subject)
//         if (!mutations) throw new Error("No mutations :(")

//         try {
//             runCleanups($activeEffect())
//             const _effect = new ThisEffect(watchSubject);
//             $activeEffect.set(_effect)
//             pushEffect(_effect)
//             effect(subject, mutations)
//         }
//         finally {
//             popEffect()
//         }
//     }

//     if (eager) {
//         scheduleEffectEagerly(mutationEffect, phase)
//     }

//     const forNextCycle = options?.cycle === 'next';

//     return $listen(mutationEffect, options || {}, {
//         enroll(_effect) {
//             watchSubject.watch(_effect, phase, forNextCycle)
//         },
//         remove(_effect) {
//             watchSubject.unwatch(_effect, phase)
//             // if (nestedWatcher) nestedWatcher.unwatch()
//         }
//     });
// }


function scheduleEffectEagerly(effect: Effect, phase: Phase) {
   if (phase === Phase.SYNC) {
      // runEffect(effect)
      effect()
   }
   else useRenderCycle().scheduleTask(effect, phase)
}


export function initIonicEffect(effect: () => void, options?: EffectOptions) { //NOTE: an effect is essentially a derived ion and effect combined into one function
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
   effect: Effect,
   phase: Phase,
   options: SustainedListenerOptions & RenderCycleOptions,
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
            compound.untrackAtoms()
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

