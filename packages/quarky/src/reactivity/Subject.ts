import { AnyObject } from "@luent/types";
import { Reaction } from "./Reaction"
import { hasQuark, quarkOf } from "../abstract/Quark"
import { asTrackedAtom, isTrackableAtom, Atom, TrackedAtom } from "./Atom"
import { isFunction, isObject, noop } from "@luent/utils";
import { isIon, toValue } from "../ion/utils";
import { WatchSubjects } from "./Watcher";
import { Compound, popTracker, pushTracker } from "./Compound";
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
  // TODO: do not retrack if reaction runs once
  return isIonicProxy(subject) ? new ProxySubject(subject)
    : isFunction(subject) ? new IonSubject(subject, retrack)
      : { reactive: false, getState() { return subject }, linkReaction(reaction: Reaction) { } }  //non-ionized object
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

  linkReaction(reaction: Reaction): void {
    const subjects = this.subjects;
    for (const subject of subjects) {
      if (!subject.reactive) continue;
      subject.linkReaction(reaction)
    }
  }
}




export interface Subject {
  reactive: boolean,
  linkReaction(reaction: Reaction): void
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

  linkReaction(reaction: Reaction) {
    this.forEachAtom(atom => {
      linkReactionToAtom(atom, reaction)
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
    //    this.linkReaction(new Reaction(() => {
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

  reaction: Reaction | undefined

  private retrackedCall() { // TODO: retrack call only if stale
    if (!this.retrack || !this.reactive)
      return this.fn()
    // if (!this.stale) {
    //    console.log('### not stale')
    //    return this.state.get()
    // }
    const reaction = this.reaction
    if (!reaction) throw new Error('Must call linkReaction before retracking')
    console.log('@&@ retrack call', this.fn)
    reaction.unlink()
    this.untrackAtoms()
    const output = this.trackAtoms(this.fn)
    this.forEachAtom(atom => {
      //  if ('key' in atom && 'modelQuark' in atom && atom.key === 'completed') console.log('@&@ link reaction', atom)
      linkReactionToAtom(atom, reaction)
    })
    // this.state.set(output)
    return output;
  }

  linkReaction(reaction: Reaction): void {
    this.reaction = reaction;
    this.forEachAtom(atom => {
      linkReactionToAtom(atom, reaction)
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
  get reactive(): boolean {
    if (this.nestedSubject) {
      return this.subject.reactive || this.nestedSubject.reactive
    }
    return this.subject.reactive
  }

  private subject: FunctionSubject
  private nestedSubject: ProxySubject | IonSubject | undefined

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

  linkReaction(reaction: Reaction): void {
    if (this.reactive)
      this.subject.linkReaction(reaction)
    this.nestedSubject?.linkReaction(reaction)
  }

  private relinkProxy = () => {
    if (!this.retrack) {
      this.relinkProxy = noop
      return;
    }
    this.relinkProxy = () => {
      const reaction = this.subject.reaction
      if (!reaction) {
        return;
        throw new Error('Must call linkReaction before retracking')
      }
      this.nestedSubject?.linkReaction(reaction)
    }
  }

  getState() {
    const value = this.subject.trackedCall()
    if (value !== this.nestedSubject?.getState()) {
      if (isFunction(value)) {
        this.nestedSubject = new IonSubject(value)
      }
      else if (isIonicProxy(value)) {
        this.nestedSubject = new ProxySubject(value)
      }
    }
    this.relinkProxy()
    return value;
  }
}


// /**
//  * - relinks value to reaction if value is ionized
//  * - relinks derivation atoms to reaction on every call if derivation ion
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
//          this.reaction.unlink()
//          const value = detachedCall(() => this.retrackCall(this.ion))
//          if (isIonicProxy(value)) {
//             trackAbsorbedIons(this, value)
//          }
//          this.forEachAtom(atom => {
//             linkReactionToAtom(atom, this.reaction)
//          })
//          this.relinkValue(value)
//          return value;
//       }
//       else {
//          const value = this.ion()
//          if (isIonicProxy(value)) {
//             trackAbsorbedIons(this, value)
//          }
//          this.forEachAtom(atom => {
//             linkReactionToAtom(atom, this.reaction)
//          })
//          this.relinkValue(value)
//          return value;
//       }
//    }

//    private reaction!: Reaction;

//    linkReaction(reaction: Reaction) {
//       this.reaction = reaction;
//       this.forEachAtom(atom => {
//          linkReactionToAtom(atom, reaction)
//       })
//       linkReactionToAtom(this.valueAtom, reaction)
//    }

//    private relinkValue(
//       value: unknown,
//    ) {
//       linkReactionToAtom(this.valueAtom, this.reaction);
//       linkReactionToAtom(this.valueAtom = isTrackableAtom(value) ? quarkOf(value) : undefined, this.reaction);
//    }

// }



function linkReactionToAtom(atom: Atom | undefined, reaction: Reaction) {
  if (!atom) return;
  reaction.link(asTrackedAtom(atom))
}


