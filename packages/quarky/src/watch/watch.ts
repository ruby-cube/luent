import { AnyObject } from "@rue/types";
import { asWatchSubject, WatchSubject } from "./WatchSubject";
import { $listen, ResumableListener, getActiveFlask, SustainedListenerOptions } from "@rue/flask";
import { IonicCompound } from "../ionic/IonicCompound";
import { getCurrentRenderCycle, Phase, useRenderCycle } from "./RenderCycle";
import { WatchDebugOptions } from "./debug";
import { ReactiveGet, DerivedIon, isDerivedIon, createDerivedIon } from "../ionic/DerivationIon";
import { isIonizedModel, toRaw, } from "../ionized/ionize";
import { areEqual } from "./areEqual";
import { createIonicEffect, IonicEffect } from "../ionic/IonicEffect";
import { isReactive } from "../reactivity/ReactiveEntity";
import { __devCheckIfTracked } from "../ionic/x_DependencyTracker";
import { AnyIon, isMuon } from "../ion/Ion";
import { AtomicIon } from "../ion/PrimaryIon";
import { asIonicAtom } from "../ionic/IonicAtom";
import { isPropIon, PropIon } from "../ionized/PrimaryPion";
import { toValue } from "../ion/toIons";
import { StateChangeEvent } from "./StateChangeEvent";
import { quarksOf, QUARKS, QuarkyEntity } from "../QuarkyEntity";


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
   only?: (boolean | AnyObject | AnyIon)[];
   also?: AnyObject[]
} & RenderCycleOptions & SustainedListenerOptions & WatchDebugOptions



export type MutationRecord = {
   target: AnyObject | AtomicIon | PropIon,
   op: string,
   args: any[],
   output: any,
   preopData?: any
}


// export type MutationEffect<T extends IonizedModel = IonizedModel> = (newValue: T, mutations: MutationRecord[]) => void
export type OnChangeHandler<T = any> = (event: StateChangeEvent<T>) => void
// :  (newValue: 'frog', oldValue: 'frog') => void
// (newValue: { [K in keyof T]: T[K] extends () => infer R ? R : T[K] }, oldValue: { [K in keyof T]: T[K] extends () => infer R ? R : T[K] }) => void
// : (newValue: T, oldValue: T) => void

export type ReactiveEffect = {
   (): void;
} & QuarkyEntity<IonicCompound>

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



export type RawEffect = (a: any, b: any) => void


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


function normalizeWatchSubjects(subjects: ((AnyIon | AnyObject)[]) | undefined) {
   if (!subjects) return;
   for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i]
      subjects[i] = normalizeWatchSubject(subject)
   }
   return subjects;
}

function normalizeWatchSubject(subject: AnyIon | AnyObject) {
   if (subject instanceof Function)
      return createDerivedIon(subject)
   if (isPropIon(subject)) {
      quarksOf(subject).watch()
      return subject;
   }
   if (isIonizedModel(subject)) {
      quarksOf(subject).trackAbsorbedIons()
      return subject;
   }
   return subject;
}

function asWatchSubjects(subjects: (AnyIon | AnyObject)[]) {
   const watchSubjects: WatchSubject[] = []
   for (const subject of subjects) {
      watchSubjects.push(asWatchSubject(subject))
   }
   return watchSubjects
}

function getValues(subjects: (AnyIon | AnyObject)[]) {
   const values = [];
   for (const subject of subjects) {
      values.push(toValue(subject))
   }
   return values;
}



// get ionic derivations for reactive getters
function getIonicDerivations(inputSubjects: (AnyIon | AnyObject)[], subjects: (AnyIon | AnyObject)[]) {
   const derivations: IonicCompound[] = []
   for (let i = 0; i < inputSubjects.length; i++) {
      const inputSubject = inputSubjects[i]
      if (inputSubject instanceof Function) {
         derivations.push(quarksOf(subjects[i]) as IonicCompound)
      }
   }
   if (derivations.length) return derivations;
}



function isMultiWatchSubject(subject: AnyObject | AnyIon | (AnyIon | AnyObject)[]): subject is (AnyIon | AnyObject)[] {
   if (isMuon(subject)) return false;
   if (!isIonizedModel(subject) && subject instanceof Array) {
      for (const item of subject) {
         if (isReactive(item)) return true;
      }
      return false;
   }
   return false;
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
// export function watch<T extends AnyIon | ReactiveGet>(subject: T, effect: T extends () => infer R ? OnChangeHandler<R> : never, options?: WatchOptions): ResumableListener
// export function watch<T extends IonizedModel>(subject: T, effect: MutationEffect<T>, options?: WatchOptions): ResumableListener
export function watch<T>(subject: T, effect: OnChangeHandler<T>, options?: WatchOptions): ResumableListener {
   const isMultiSubject = isMultiWatchSubject(subject);
   if (!isMultiSubject && !(subject instanceof Function) && !isReactive(subject)) {
      return InertWatcher()
   }
   // if ('name' in subject && subject.name === '__$propIon') console.log(subject)


   let eager: boolean | undefined = options?.eager
   const watchStateChange = options?.stateChange === false ? false : true;
   const phase = options?.phase ?? Phase.BEFORE_RENDER

   const subjects = isMultiSubject ? normalizeWatchSubjects(subject)! : [normalizeWatchSubject(subject)]
   const watchSubjects = asWatchSubjects(subjects)
   const subject0 = subjects[0];
   // const _watchSubject = isMultiSubject ? watchSubjects : watchSubjects[0];
   const ionicDerivations = isMultiSubject ? getIonicDerivations(subject, subjects) : subject instanceof Function ? [quarksOf(subject0) as IonicCompound] : undefined

   let oldValue: T;
   try {
      oldValue = isMultiSubject ? getValues(subjects) : toValue(subject0) // This is when derived is initialized if not already
   }
   catch (err) {
      if (err instanceof Object && 'cause' in err && err.cause === 'no dependencies') {
         if (__DEV__) console.warn('inert watcher', effect)
         return InertWatcher()
      }
   }

   if (isIonizedModel(oldValue) && oldValue !== subject) {
      watch(oldValue, effect, options)
   }

   const watchEffect = createWatchEffect()

   function changeHandler() {
      if (currentEffect && currentEffect === watchEffect) return; // prevent infinite loops for synchronous effects
      pushEffect(watchEffect)
      const newValue = isMultiSubject ? getValues(subjects) : toValue(subject0) // This is when retracking happens

      if (watchStateChange && (!eager && (isMultiSubject && noChanges(subjects, newValue, oldValue)
         || isMuon(subject0) && noChange(newValue, oldValue)
         || isIonizedModel(subject) && noMutations(subject)))
      )
         return;
      eager = false;

      let prevSubject = currentWatchSubject;
      try {
         currentWatchSubject = subjects // prevents infinite loops for synchronous effects //TODO: do we need this in watchModel and initialize effect?
         // pushEffect(_effect)
         effect(new StateChangeEvent(subject, newValue, oldValue, getMutations(subjects)))
      }
      finally {
         popEffect()
         currentWatchSubject = prevSubject;
         oldValue = newValue;
      }
   }

   if (eager) {
      scheduleEffectEagerly(changeHandler, phase)
   }

   return setUpWatcher(
      watchSubjects,
      changeHandler,
      phase,
      options || {},
      ionicDerivations
   )
}



function noChange(newValue: any, oldValue: any) {
   return areEqual(toRaw(newValue), toRaw(oldValue))
}

function noChanges(subjects: any[], newValues: any[], oldValues: any[]) {
   for (let i = 0; i < subjects.length; i++) {
      if (isMuon(subjects[i])) {
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

//     const watchSubject = asWatchSubject(subject);

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


export function watchEffect(effect: () => void, options?: EffectOptions) { //NOTE: an effect is essentially a derived ion and effect combined into one function
   const phase = options?.phase || Phase.BEFORE_RENDER;
   const retrack = options?.retrack || false;

   const reactiveEffect = createIonicEffect(effect, retrack)
   const watchSubject = asWatchSubject(reactiveEffect);

   // if (__DEV__ && selectiveSubjects && options?.also)
   // throw Error(`INVALID OPTIONS: Cannot configure watchEffect with both 'only' and 'also' options.`)

   scheduleEffectEagerly(reactiveEffect.initialize, phase);

   return setUpWatcher(
      [watchSubject],
      reactiveEffect,
      // $activeEffect,
      phase,
      options || {},
      [quarksOf(reactiveEffect)]
   )
}


function setUpWatcher(
   watchSubjects: WatchSubject[],
   effect: Effect,
   phase: Phase,
   options: SustainedListenerOptions & RenderCycleOptions,
   ionicDerivations?: IonicCompound[]
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
         for (const subject of watchSubjects) {
            subject.watch(_effect, phase, forNextCycle)
         }
      },
      remove(_effect) {
         for (const subject of watchSubjects) {
            subject.unwatch(_effect, phase)
         }
         if (ionicDerivations) {
            for (const derivation of ionicDerivations) {
               derivation.untrackAtoms()
            }
         }
      },
      pause() {
         for (const subject of watchSubjects) {
            subject.watch(markDirty, phase)
         }
         return () => {
            for (const subject of watchSubjects) {
               subject.unwatch(markDirty, phase)
            }
         }
      },
      resume() {
         for (const subject of watchSubjects) {
            subject.unwatch(markDirty, phase)
         }
         if (dirty) {
            wrappedEffect()
            dirty = false;
         }
      }
   });



   // return {
   //    stop,
   //    pause() {
   //       console.log('pause watcher')
   //       const success = pause()
   //       if (!success) return false;
   //       for (const subject of watchSubjects) {
   //          subject.watch(markDirty, phase)
   //       }
   //       function markDirty() {
   //          dirty = true;
   //       }
   //       return true;
   //    },
   //    resume() {
   //       console.log('resume watcher')
   //       const success = resume()
   //       if (!success) return false;
   //       if (dirty) wrappedEffect()
   //       dirty = false;
   //       return true;
   //    }
   // }
}

