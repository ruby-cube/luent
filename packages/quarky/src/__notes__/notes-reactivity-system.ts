/* 

- IonicAtoms (deps) (linkable)
   - atomic ion
   - pion
   - trackable op

- IonicCompounds (subs) (linkable)
   - memoized derivations
   - ionic effects

- WatchedAtom
   - ionized model
   - atomic ions
   - pion
   - ionic compound (derivation or effect)

- WatchEffects (linkable)
*/


/**
* Managed Atomic Muon
* - writable state property
* - optional methods
* ---lazily bind `this` to muon so you can just pass the method instead of wrapping in arrow function
* - reactivity (ion) or inert (neutron)
* - auto-ionize state if initialized with ionized state
* 
* Managed Derivation Ion
* - memoization
* ---retracking
* - provide previous state to derivation
*  */

/** 
* Instead of writing all this:
*
* let _count: number = 0;
*
* function $count() {
*    return _count;
* }
*
* Object.defineProperties($count, {
*    // writable state property
*    state: {
*       get() {
*          return _count;
*       },
*       set(count: number) {
*          _count = count;
*       }
*    },
*    // methods
*    increment: {
*
*    }
* }) 
* 
* 
* */

import { Particle, ParticleMorph } from "../compound/Particle"
import { Quark, QuarkyEntity } from "../Quark"

//ABSTRACT





interface Link {
   atom: Particle,
   compound: IonicCompound,
   nextParticle: Link | undefined,
   nextCompound: Link | undefined
}

interface WatchedAtom {
   effects?: Set<WatchEffect>
   effectsHead?: WatchEffect
   effectsTail?: WatchEffect
}

function triggerEffects(subject: WatchedAtom) {
   // TODO:
   // run sync
   // or schedule
}

interface WatchEffect {
   next: WatchEffect
}










/* INTERNAL */

type AtomicPion = WritableMuon & QuarkyEntity<AtomicPionQuark> // If a property is non-writable, simply return a derivation function

type MemoizedIon = MemoizedDerivation & QuarkyEntity<MemoizedIonQuark>

type IonicEffect = () => void/* TODO: */ & QuarkyEntity<IonicEffectQuark>

type IonizedModel = QuarkyEntity<IonizedModelQuark>


type IonicWatchEffect = IonicCompound & WatchEffect

function triggerIonicEffect(this: IonicWatchEffect) {
   triggerEffects(this)
}



type IonizedModelQuark = IonicCompound & Quark<IonizedModel>




class AtomicOp implements Particle {
   react: (this: Particle, oldState: unknown, newState: unknown) => void
   effects?: Set<WatchEffect> | undefined
   effectsHead?: WatchEffect | undefined
   effectsTail?: WatchEffect | undefined
   compounds?: Set<IonicCompound> | undefined
   compoundsHead?: Link | undefined
   compoundsTail?: Link | undefined
   triggerCompounds: () => void // trigger derivations


} // 'trackable get ops'


class MemoizedIonQuark implements IonicCompound, Particle, WatchedAtom, Quark<MemoizedIon> {
   react: (this: Particle, oldState: unknown, newState: unknown) => void
   type: string | symbol
   particles: Set<Particle>
   particlesHead: Link | undefined
   particlesTail: Link | undefined
   stale: boolean
   compounds?: Set<IonicCompound> | undefined
   compoundsHead?: Link | undefined
   compoundsTail?: Link | undefined
   triggerCompounds: () => void // trigger derivations

   effects: Set<WatchEffect>
   effectsHead: WatchEffect
   effectsTail: WatchEffect
   triggerEffects: () => void
   entity: MemoizedIon
   trigger() {
      if (this.isWatched) this.triggerEffects()
   }
}

class IonicEffectQuark implements IonicCompound, WatchedAtom, Quark<IonicEffect> {
   trigger: (this: IonicCompound, oldState: unknown, newState: unknown) => void
   type: string | symbol
   particles: Set<Particle>
   particlesHead: Link | undefined
   particlesTail: Link | undefined
   stale: boolean
   effects: Set<WatchEffect>
   effectsHead: WatchEffect
   effectsTail: WatchEffect
   triggerEffects: () => void
   entity: IonicEffect

}









