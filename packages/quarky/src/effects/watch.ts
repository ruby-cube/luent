import { AnyObject } from "@rue/types";
import { asWatchSubject, WatchSubject } from "./WatchSubject";
import { $listen, ActiveListener, getFlask, ListenerOptions } from "@rue/flask";
import { IonicDerivation } from "../derivations/IonicDerivation";
import { getCurrentRenderCycle, Phase, useRenderCycle } from "./RenderCycle";
import { WatchDebugOptions } from "./debug";
import { ReactiveGet, DerivedIon, isDerivedIon, createDerivedIon } from "../derivations/DerivedIon";
import { asMetaIonizedModel, Ionized, isIonizedModel, toRaw, } from "../ionize/ionize";
import { areEqual } from "./areEqual";
import { createIonicEffect, IonicEffect } from "../derivations/IonicEffect";
import { isReactive, META } from "../ReactiveEntity";
import { __devCheckIfTracked } from "../derivations/DependencyTracker";
import { AnyIon, isIon } from "../ion/Ion";
import { asMetaIon, isAtomicIon, AtomicIon } from "../ion/AtomicIon";
import { asIonicAtom } from "../derivations/IonicAtom";
import { isPropIon, PropIon } from "../ionize/PropIon";
import { popEffect, pushEffect, runCleanups, ThisEffect } from "./ThisEffect";
import { neutron, Neutron } from "../ion/Neutron";


type RenderCycleOptions = {
   phase?: Phase;
   cycle?: 'current' | 'next'
}

export type WatchOptions = {
   // deep?: boolean;
   eager?: true;
   // retrack?: boolean;
} & RenderCycleOptions & ListenerOptions & WatchDebugOptions

export type EffectOptions = {
   retrack?: true;
   only?: (boolean | Ionized<AnyObject> | AnyIon)[];
   also?: (Ionized<AnyObject>)[]
} & RenderCycleOptions & ListenerOptions & WatchDebugOptions



export type MutationRecord = {
   target: Ionized<AnyObject> | AtomicIon | PropIon,
   op: string,
   args: any[],
   output: any,
   preopData?: any
}


// export type MutationEffect<T extends IonizedModel = IonizedModel> = (newValue: T, mutations: MutationRecord[]) => void
export type OnChangeHandler<T = any> = T extends () => infer R ? (newValue: R, oldValue: R) => void
   // :  (newValue: 'frog', oldValue: 'frog') => void
   // (newValue: { [K in keyof T]: T[K] extends () => infer R ? R : T[K] }, oldValue: { [K in keyof T]: T[K] extends () => infer R ? R : T[K] }) => void
   : (newValue: T, oldValue: T) => void

export type ReactiveEffect = {
   (): void;
   [META]: IonicDerivation;
}

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


let currentWatchSubject: DerivedIon | AtomicIon | Ionized<AnyObject> | undefined // prevents infinite loops for synchronous effects that set ions

export function isCurrentWatchSubject(atom: AtomicIon | PropIon) {
   if (!currentWatchSubject) return false;
   if (currentWatchSubject === atom) return true;
   if (isDerivedIon(currentWatchSubject)) {
      return asMetaIon(currentWatchSubject).atoms.has(asIonicAtom(atom))
   }
   if (isIonizedModel(currentWatchSubject)) {
      if (isPropIon(atom)) {
         return asMetaIon(atom).model === currentWatchSubject;
      }
      //TODO: what about absorbed ions?
   }

}


function normalizeWatchSubjects(subjects: ((AnyIon | ReactiveGet | Ionized<AnyObject>)[]) | undefined) {
   if (!subjects) return;
   for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i]
      subjects[i] = normalizeWatchSubject(subject)
   }
   return subjects;
}

function normalizeWatchSubject(subject: AnyIon | ReactiveGet | Ionized<AnyObject>) {
   if (subject instanceof Function)
      return createDerivedIon(subject)
   if (isPropIon(subject)) {
      asMetaIon(subject).watch()
      return subject;
   }
   if (isIonizedModel(subject)) {
      asMetaIonizedModel(subject).trackAbsorbedIons()
      return subject;
   }
   return subject;
}

function asWatchSubjects(subjects: (AnyIon | Ionized<AnyObject>)[]) {
   const watchSubjects: WatchSubject[] = []
   for (const subject of subjects) {
      watchSubjects.push(asWatchSubject(subject))
   }
   return watchSubjects
}

function getValues(subjects: (AnyIon | Ionized<AnyObject>)[]) {
   const values = [];
   for (const subject of subjects) {
      values.push(getValue(subject))
   }
   return values;
}

function getValue(subject: AnyIon | Ionized<AnyObject>) {
   console.log('get value', subject)
   return isIon(subject) ? subject() : subject;
}

// get ionic derivations for reactive getters
function getIonicDerivations(inputSubjects: (AnyIon | ReactiveGet | Ionized<AnyObject>)[], subjects: (AnyIon | Ionized<AnyObject>)[]) {
   const derivations: IonicDerivation[] = []
   for (let i = 0; i < inputSubjects.length; i++) {
      const inputSubject = inputSubjects[i]
      if (inputSubject instanceof Function) {
         derivations.push(asMetaIon(subjects[i]) as IonicDerivation)
      }
   }
   if (derivations.length) return derivations;
}



function isMultiWatchSubject(subject: AnyObject | AnyIon | ReactiveGet | Ionized<AnyObject> | (AnyIon | AnyObject | ReactiveGet | Ionized<AnyObject>)[]): subject is (AnyIon | AnyObject | ReactiveGet | Ionized<AnyObject>)[] {
   if (isIon(subject)) return false;
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
// export function watch<T extends AnyIon | ReactiveGet>(subject: T, effect: T extends () => infer R ? OnChangeHandler<R> : never, options?: WatchOptions): ActiveListener
// export function watch<T extends IonizedModel>(subject: T, effect: MutationEffect<T>, options?: WatchOptions): ActiveListener
export function watch<T>(subject: T, effect: OnChangeHandler<T>, options?: WatchOptions): ActiveListener {
   const isMultiSubject = isMultiWatchSubject(subject);
   if (!isMultiSubject && !(subject instanceof Function) && !isReactive(subject)) {
      return InertWatcher()
   }
   // if ('name' in subject && subject.name === '__$propIon') console.log(subject)

   let eager: boolean | undefined = options?.eager
   const phase = options?.phase ?? Phase.BEFORE_RENDER

   const subjects = isMultiSubject ? normalizeWatchSubjects(subject)! : [normalizeWatchSubject(subject)]
   const watchSubjects = asWatchSubjects(subjects)
   const subject0 = subjects[0];
   // const _watchSubject = isMultiSubject ? watchSubjects : watchSubjects[0];
   const ionicDerivations = isMultiSubject ? getIonicDerivations(subject, subjects) : subject instanceof Function ? [asMetaIon(subject0) as IonicDerivation] : undefined

   let oldValue: T;
   try {
      oldValue = isMultiSubject ? getValues(subjects) : getValue(subject0) // This is when derived is initialized if not already
   }
   catch (err) {
      if (err instanceof Object && 'cause' in err && err.cause === 'no dependencies') {
         if (__DEV__) console.warn('inert watcher', effect)
         return InertWatcher()
      }
   }

   if (isIonizedModel(oldValue) && oldValue !== subject){
      watch(oldValue, effect, options)
   }

   const $activeEffect = neutron() as Neutron<ThisEffect>

   function changeHandler() {
      console.log('running change handler!')
      const newValue = isMultiSubject ? getValues(subjects) : getValue(subject0) // This is when retracking happens

      if (!eager && (isMultiSubject && noChanges(subjects, newValue, oldValue)
         || isIon(subject0) && noChange(newValue, oldValue)
         || isIonizedModel(subject) && noMutations(subject)))
         return;
      eager = false;
      runCleanups($activeEffect())
      const _effect = new ThisEffect(getMutations(subjects));
      $activeEffect.value = _effect

      let prevSubject = currentWatchSubject;
      try {
         currentWatchSubject = subjects // prevents infinite loops for synchronous effects //TODO: do we need this in watchModel and initialize effect?
         pushEffect(_effect)
         effect(newValue, oldValue)
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
      $activeEffect,
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

function noMutations(model: Ionized<AnyObject>) {
   //TODO: 
   return false;
}

//TODO: Figure out what is the best format to use. Should mutations be in order of mutation? or organized by mutation target?
function getMutations(subjects: (AnyIon | Ionized<AnyObject>)[]) {
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

//     asMetaIonizedModel(subject).trackAbsorbedIons()

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
   // const selectiveSubjects = options?.only;
   // const selector = selectiveSubjects?.[0] === true ? true : false;
   // const additionalSubjects = normalizeWatchSubjects(options?.also || selector ? <any[]>selectiveSubjects!.slice(1) : selectiveSubjects);
   // const additionalWatchSubjects = additionalSubjects ? asWatchSubjects(additionalSubjects) : [];
   const $activeEffect = neutron() as Neutron<ThisEffect>
   const reactiveEffect = createIonicEffect(effect, $activeEffect, retrack)
   const watchSubject = asWatchSubject(reactiveEffect);

   // if (__DEV__ && selectiveSubjects && options?.also)
      // throw Error(`INVALID OPTIONS: Cannot configure watchEffect with both 'only' and 'also' options.`)

   scheduleEffectEagerly(reactiveEffect.initialize, phase);

   return setUpWatcher(
      [watchSubject],
      reactiveEffect,
      $activeEffect,
      phase,
      options || {},
      [reactiveEffect[META]]
   )
}


function setUpWatcher(
   watchSubjects: WatchSubject[],
   effect: Effect,
   $activeEffect: Neutron<ThisEffect>,
   phase: Phase,
   options: ListenerOptions & RenderCycleOptions,
   ionicDerivations?: IonicDerivation[]
) {
   let wrappedEffect: () => void;
   const forNextCycle = options?.cycle === 'next';
   const { pause, resume, stop } = $listen(effect, options || {}, {
      enroll(_effect) {
         wrappedEffect = _effect;
         for (const subject of watchSubjects) {
            subject.watch(_effect, phase, forNextCycle)
         }
      },
      remove(_effect) {
         runCleanups($activeEffect())
         for (const subject of watchSubjects) {
            subject.unwatch(_effect, phase)
         }
         if (ionicDerivations) {
            for (const derivation of ionicDerivations) {
               derivation.untrackAtoms()
            }
         }
      }
   });

   let dirty = false;

   return {
      stop,
      pause() {
         const success = pause()
         if (!success) return false;
         for (const subject of watchSubjects) {
            subject.watch(markDirty, phase)
         }
         function markDirty() {
            dirty = true;
         }
         return true;
      },
      resume() {
         const success = resume()
         if (!success) return false;
         if (dirty) wrappedEffect()
         dirty = false;
         return true;
      }
   }
}

