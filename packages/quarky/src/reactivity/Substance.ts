import { AnyObject } from "@luently/types";
import { Reaction } from "./Reaction"
import { hasQuark, quarkOf } from "../abstract/Quark"
import { asTrackedAtom, isTrackableAtom, Atom, TrackedAtom } from "./Atom"
import { isFunction, isObject, noop } from "@luently/utils";
import { isIon, toValue } from "../ion/utils";
import { ObservedSubstances } from "./Observer";
import { Compound, Particle, popTracker, pushTracker } from "./Compound";
import type { QuarkyIonicProxy } from "../ionic/ModelQuark";
import { Traceable, TraceableEntity } from "../debug/Traceable";
import { Stateful } from "../abstract/Stateful";
import { isIonicProxy } from "../ionic/IonicModel";


export function isSubstance(value: AnyObject): value is Substance {
  if ('reactive' in value) return value.reactive;
  return false;
}

const MULTISUBJECT = '--multisubstance' as const

export function multisubstance<S extends unknown[]>(...substance: S) {
  const subj = substance as S & { [MULTISUBJECT]: true }
  subj[MULTISUBJECT] = true;
  return subj;
}


// observe collection
// observe properties -- must specify which properties to observe in multi substance: absorbed ions and derivation ions

type StatefulSubstance = Substance & Stateful

export function asSubstance(target: unknown, retrack: boolean): StatefulSubstance & TraceableEntity {
  return isMultisubstance(target) ? new Multisubstance(target, retrack)
    : asMonosubstance(target, retrack)
}

function asMonosubstance(substance: unknown, retrack: boolean) {
  // TODO: do not retrack if reaction runs once
  return isIonicProxy(substance) ? new ProxySubstance(substance)
    : isFunction(substance) ? new IonSubstance(substance, retrack)
      : { reactive: false, getState() { return substance }, linkReaction(reaction: Reaction) { } }  //non-ionized object
}

function isMultisubstance(substance: unknown): substance is ObservedSubstances {
  return isObject(substance) && MULTISUBJECT in substance;
}




class Multisubstance implements StatefulSubstance, TraceableEntity {
  asTraceable?: Traceable | undefined;
  private substances: StatefulSubstance[] = []
  reactive: boolean = true;

  constructor(multisubstance: ObservedSubstances, retrack: boolean) {
    const substances = this.substances;
    for (const substance of multisubstance) {
      const monosubstance = asMonosubstance(substance, retrack)
      substances.push(monosubstance)
    }
  }

  inertCount: number = 0;

  private get = () => {
    this.get = () => {
      const values = []
      for (const substance of this.substances) {
        values.push(substance.getState())
      }
      return values;
    }

    // initial get
    const values = []
    for (const substance of this.substances) {
      values.push(substance.getState())
      if (!substance.reactive) this.inertCount++
    }

    if (this.inertCount === this.substances.length) {
      this.reactive = false;
    }
    return values;
  }

  getState() {
    return this.get()
  }

  linkReaction(reaction: Reaction): void {
    const substances = this.substances;
    for (const substance of substances) {
      if (!substance.reactive) continue;
      substance.linkReaction(reaction)
    }
  }
}




export interface Substance {
  reactive: boolean,
  linkReaction(reaction: Reaction): void
}


/**
 * Watching ionized models will NOT track absorbed ions and derivations. 
 * To observe absorbed ions and derivations, use multisubstance
 */
class ProxySubstance extends Compound implements StatefulSubstance, TraceableEntity {
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
  //    console.log('ionic proxy substance')
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

// TODO: currently we are retracking every single substance even if they are identical to another functional substance that has been retrack.
// To make things more efficient, we need to share/reuse functional substances if they track the same ion and only retrack if they are stale.

/**
 * Primitive substance for derivation ions and ionic tasks.
 */
export class FunctionSubstance extends Compound implements Substance, TraceableEntity {
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
    // observe(fn, () => {
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
 * A substance composed of FunctionSubstance and (maybe) ProxySubstance. Wraps watched ions.
 */
export class IonSubstance implements StatefulSubstance, TraceableEntity {
  get reactive(): boolean {
    if (this.nestedSubstance) {
      return this.substance.reactive || this.nestedSubstance.reactive
    }
    return this.substance.reactive
  }

  private substance: FunctionSubstance
  private nestedSubstance: ProxySubstance | IonSubstance | undefined

  asTraceable?: Traceable | undefined

  get particles(): Particle[] {
    return [...this.substance.particles, ...(this.nestedSubstance?.particles ?? [])]
  }

  constructor(
    getter: () => unknown,
    private retrack: boolean = true
  ) {
    const quark = hasQuark(getter) ? quarkOf(getter) : {}
    this.substance = quark instanceof FunctionSubstance ? quark : new FunctionSubstance(getter, retrack, false);
  }

  linkReaction(reaction: Reaction): void {
    if (this.reactive)
      this.substance.linkReaction(reaction)
    this.nestedSubstance?.linkReaction(reaction)
  }

  private relinkProxy = () => {
    if (!this.retrack) {
      this.relinkProxy = noop
      return;
    }
    this.relinkProxy = () => {
      const reaction = this.substance.reaction
      if (!reaction) {
        return;
        throw new Error('Must call linkReaction before retracking')
      }
      this.nestedSubstance?.linkReaction(reaction)
    }
  }

  getState() {
    const value = this.substance.trackedCall()
    if (value !== this.nestedSubstance?.getState()) {
      if (isFunction(value)) {
        this.nestedSubstance = new IonSubstance(value)
      }
      else if (isIonicProxy(value)) {
        this.nestedSubstance = new ProxySubstance(value)
      }
    }
    this.relinkProxy()
    return value;
  }
}



// async function loadUserProjects(userId: string) {
//   const substance = getSubstance()
//   try {
//     const user = await fetchUser(userId)
//     const projects = await substance.tracked(() => fetchProjects(user.organizationId))
//     return { user, projects }

//   } catch (error) {
//     console.error("Failed to load user or projects:", error)
//     return null
//   }
// }

// /**
//  * - relinks value to reaction if value is ionized
//  * - relinks derivation atoms to reaction on every call if derivation ion
//  */
// export class IonSubstance extends IonicCompound implements WatchedSubstance {
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
//       //    : !quark.inert && isObservable(quark) ? [quark] : []

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



export function linkReactionToAtom(atom: Atom | undefined, reaction: Reaction) {
  if (!atom) return;
  reaction.link(asTrackedAtom(atom))
}


