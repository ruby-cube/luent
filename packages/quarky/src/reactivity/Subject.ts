import { AnyObject } from "@rue/types";
import { Effect } from "./Effect"
import { hasQuark, QUARK, quarkOf } from "../abstract/Quark"
import { asTrackedAtom, isTrackableAtom, Atom, TrackedAtom } from "./Atom"
import { isFunction, isObject, noop } from "@rue/utils";
import { isIon, MutableIon, toValue } from "../ion/Ion";
import { watch, WatchSubjects } from "./Watcher";
import { Compound, Particle, popTracker, pushTracker } from "./Compound";
import type { QuarkyIonicProxy } from "../ionic/ModelQuark";
import { Traceable, TraceableEntity } from "../debug/Traceable";
import { Stateful } from "../abstract/Stateful";
import { isIonicProxy } from "../ionic/IonicModel";


export function isSubject(value: AnyObject): value is Subject {
   if ('reactive' in value) return value.reactive;
   return false;
}

const MULTISUBJECT = '--multisubject' as const

export function multisubject<S extends unknown[]>(...subject: S) {
   const subj = subject as S & { [MULTISUBJECT]: true }
   subj[MULTISUBJECT] = true;
   return subj;
}


// watch collection
// watch properties -- must specify which properties to watch in multi subject: absorbed ions and derivation ions

type StatefulSubject = Subject & Stateful

export function asSubject(target: unknown, retrack: boolean): StatefulSubject & TraceableEntity {
   return isMultisubject(target) ? new Multisubject(target, retrack)
      : asMonosubject(target, retrack)
}

function asMonosubject(subject: unknown, retrack: boolean) {
   // TODO: do not retrack if effect runs once
   return isIonicProxy(subject) ? new ProxySubject(subject)
      : isFunction(subject) ? new IonSubject(subject, retrack)
         : { reactive: false, getState() { return subject }, linkEffect(effect: Effect) { } }  //non-ionized object
}

function isMultisubject(subject: unknown): subject is WatchSubjects {
   return isObject(subject) && MULTISUBJECT in subject;
}




class Multisubject implements StatefulSubject, TraceableEntity {
   asTraceable?: Traceable | undefined;
   private subjects: StatefulSubject[] = []
   reactive: boolean = true;

   constructor(multisubject: WatchSubjects, retrack: boolean) {
      const subjects = this.subjects;
      for (const subject of multisubject) {
         const monosubject = asMonosubject(subject, retrack)
         subjects.push(monosubject)
      }
   }

   inertCount: number = 0;

   private get = () => {
      this.get = () => {
         const values = []
         for (const subject of this.subjects) {
            values.push(subject.getState())
         }
         return values;
      }

      // initial get
      const values = []
      for (const subject of this.subjects) {
         values.push(subject.getState())
         if (!subject.reactive) this.inertCount++
      }

      if (this.inertCount === this.subjects.length) {
         this.reactive = false;
      }
      return values;
   }

   getState() {
      return this.get()
   }

   linkEffect(effect: Effect): void {
      const subjects = this.subjects;
      for (const subject of subjects) {
         if (!subject.reactive) continue;
         subject.linkEffect(effect)
      }
   }
}

export function isGetter(value: unknown): value is () => any {
   if (value instanceof Function && value.length === 0 !== isIon(value)) console.warn(value, 'isGetter', !isIon(value), 'isIon', isIon(value))
   return value instanceof Function && value.length === 0;
}


export interface Subject {
   reactive: boolean,
   linkEffect(effect: Effect): void
}


/**
 * Watching ionized models will NOT track absorbed ions and derivations. 
 * To watch absorbed ions and derivations, use multisubject
 */
class ProxySubject extends Compound implements StatefulSubject, TraceableEntity {
   reactive: boolean = true

   asTraceable?: Traceable | undefined;

   constructor(
      private proxy: QuarkyIonicProxy,
   ) {
      super()
      this.track(quarkOf(proxy))
      this.trackAbsorbedIons() // TODO: if absorbed ions can be reassigned, we need to retrack
   }

   getState(): unknown {
      return quarkOf(this.proxy).state.get()
   }

   // getValue() {
   //    console.log('ionic proxy subject')
   //    // TODO: retrack pions??
   //    return this.proxy
   // }

   linkEffect(effect: Effect) {
      this.forEachAtom(atom => {
         linkEffectToAtom(atom, effect)
      })
   }

   private trackAbsorbedIons() {
      const proxy = this.proxy
      const target = quarkOf(proxy).target;
      const keys = Reflect.ownKeys(target)
      for (const key of keys) {
         const value = target[key]
         // TODO: what about methods?
         if (isIon(value)) {
            if (isTrackableAtom(value)) {
               this.track(quarkOf(value))
            }
            else {
               // TODO: collect the absorbed ions of derivations and memoized ions
            }
         }
         else {
            proxy[key]; // initialize pion via access within tracking context
         }
      }
   }
}

// const STALE = Symbol('stale')

// TODO: currently we are retracking every single subject even if they are identical to another functional subject that has been retrack.
// To make things more efficient, we need to share/reuse functional subjects if they track the same ion and only retrack if they are stale.

/**
 * Primitive subject for derivation ions and ionic tasks.
 */
export class FunctionSubject extends Compound implements Subject, TraceableEntity {
   reactive: boolean = true;

   // get stale() {
   //    return this.state.get() === STALE
   // }

   // previous = new SimpleState(undefined)
   // state = new SimpleState(STALE)

   asTraceable?: Traceable | undefined;

   constructor(
      private fn: () => unknown,
      private retrack: boolean,
      private warnNoAtoms = true
   ) {
      super()
      // watch(fn, () => {
      // }, {phase: SYNC})
      // queueMicrotask(() => {
      //    this.linkEffect(new Effect(() => {
      //       console.log('### markStale')
      //       if (this.state.get() !== STALE) this.previous.set(this.state.get())
      //       this.state.set(STALE);
      //    }, SYNC))
      // // })
   }

   private call = () => {
      // (toValue in case of mutable ion getters)
      this.call = () => toValue(this.retrackedCall());
      return toValue(this.trackAtoms(this.fn))
      // return toValue(this.state.set(this.trackAtoms(this.fn)))
   }

   trackedCall() {
      const value = this.call()
      if (this.particles.length === 0) this.reactive = false;
      return value;
   }

   effect: Effect | undefined

   private retrackedCall() { // TODO: retrack call only if stale
      if (!this.retrack || !this.reactive)
         return this.fn()
      // if (!this.stale) {
      //    console.log('### not stale')
      //    return this.state.get()
      // }
      const effect = this.effect
      if (!effect) throw new Error('Must call linkEffect before retracking')
      console.log('@&@ retrack call', this.fn)
      effect.unlink()
      this.untrackAtoms()
      const output = this.trackAtoms(this.fn)
      this.forEachAtom(atom => {
         if ('key' in atom && 'modelQuark' in atom && atom.key === 'completed') console.log('@&@ link effect', atom)
         linkEffectToAtom(atom, effect)
      })
      // this.state.set(output)
      return output;
   }

   linkEffect(effect: Effect): void {
      this.effect = effect;
      this.forEachAtom(atom => {
         linkEffectToAtom(atom, effect)
      })
   }


   private trackAtoms(fn: () => any) {
      pushTracker(this);
      try {
         return fn();
      }
      finally {
         popTracker();
         if (__DEV__ && this.warnNoAtoms && this.particles.length === 0) {
            console.warn(`Ionic compound has no dependencies (and therefore no reactivity)`, this)
         }
      }
   }
}



/**
 * A subject composed of FunctionSubject and (maybe) ProxySubject. Wraps watched ions.
 */
export class IonSubject implements StatefulSubject, TraceableEntity {
   get reactive() {
      if (this.proxySubject) {
         return this.subject.reactive || this.proxySubject.reactive
      }
      return this.subject.reactive
   }

   private subject: FunctionSubject
   private proxySubject: ProxySubject | undefined

   asTraceable?: Traceable | undefined

   get particles() {
      return this.subject.particles // TODO: what about proxy Subject
   }

   constructor(
      getter: () => unknown,
      private retrack: boolean = true
   ) {
      const quark = hasQuark(getter) ? quarkOf(getter) : {}
      this.subject = quark instanceof FunctionSubject ? quark : new FunctionSubject(getter, retrack, false);
   }

   linkEffect(effect: Effect): void {
      if (this.reactive)
         this.subject.linkEffect(effect)
      this.proxySubject?.linkEffect(effect)
   }

   private relinkProxy = () => {
      if (!this.retrack) {
         this.relinkProxy = noop
         return;
      }
      this.relinkProxy = () => {
         const effect = this.subject.effect
         if (!effect) {
            return;
            throw new Error('Must call linkEffect before retracking')
         }
         this.proxySubject?.linkEffect(effect)
      }
   }

   getState() {
      const value = this.subject.trackedCall()
      if (value !== this.proxySubject?.getState() && isIonicProxy(value)) {
         this.proxySubject = new ProxySubject(value)
      }
      this.relinkProxy()
      return value;
   }
}


// /**
//  * - relinks value to effect if value is ionized
//  * - relinks derivation atoms to effect on every call if derivation ion
//  */
// export class IonSubject extends IonicCompound implements WatchedSubstance {
//    inert: boolean = false;

//    private valueAtom?: Atom
//    retrack: boolean;
//    // private quark: { asCompound?: IonicCompound, inert: boolean } & Quark

//    constructor(
//       private ion: Ion,
//    ) {
//       super()
//       this.retrack = isManagedDerivation(ion)
//    }

//    private initialized = false;

//    getValue() {
//       if (this.initialized)
//          return this.retrackedCall()

//       this.initialized = true;
//       const ion = this.ion;
//       const quark = hasQuark(ion) ? quarkOf(ion) : undefined
//       const value = isParticle(quark) ? (this.atoms.push(quark), detachedCall(ion)) : detachedCall(() => this.trackCall(ion))

//       // this.atoms = compound ? compound.atoms.length ? compound.atoms : (quark.inert = true, [])
//       //    : !quark.inert && isWatchable(quark) ? [quark] : []

//       if (isIonicProxy(value)) {
//          this.valueAtom = quarkOf(value)
//          trackAbsorbedIons(this, value)
//       }
//       return value;
//    }

//    private retrackedCall() {
//       const retrack = this.retrack;
//       if (retrack) {
//          this.effect.unlink()
//          const value = detachedCall(() => this.retrackCall(this.ion))
//          if (isIonicProxy(value)) {
//             trackAbsorbedIons(this, value)
//          }
//          this.forEachAtom(atom => {
//             linkEffectToAtom(atom, this.effect)
//          })
//          this.relinkValue(value)
//          return value;
//       }
//       else {
//          const value = this.Ion()
//          if (isIonicProxy(value)) {
//             trackAbsorbedIons(this, value)
//          }
//          this.forEachAtom(atom => {
//             linkEffectToAtom(atom, this.effect)
//          })
//          this.relinkValue(value)
//          return value;
//       }
//    }

//    private effect!: Effect;

//    linkEffect(effect: Effect) {
//       this.effect = effect;
//       this.forEachAtom(atom => {
//          linkEffectToAtom(atom, effect)
//       })
//       linkEffectToAtom(this.valueAtom, effect)
//    }

//    private relinkValue(
//       value: unknown,
//    ) {
//       linkEffectToAtom(this.valueAtom, this.effect);
//       linkEffectToAtom(this.valueAtom = isTrackableAtom(value) ? quarkOf(value) : undefined, this.effect);
//    }

// }



function linkEffectToAtom(atom: Atom | undefined, effect: Effect) {
   if (!atom) return;
   effect.link(asTrackedAtom(atom))
}


