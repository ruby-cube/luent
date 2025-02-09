/* 

- IonicAtoms (deps) (linkable)
   - atomic ion
   - pion
   - trackable op

- IonicCompounds (subs) (linkable)
   - memoized derivations
   - ionic effects

- Watched
   - ionized model
   - atomic ions
   - pion
   - ionic compound (derivation or effect)

- WatchEffects (linkable)
*/

import { Particle, MaybeParticle } from "../Compound/Particle"
import { Quarks, QuarkyEntity } from "../Quarks"

//ABSTRACT





interface Link {
   atom: Particle,
   compound: IonicCompound,
   nextParticle: Link | undefined,
   nextCompound: Link | undefined
}

interface Watched {
   effects?: Set<WatchEffect>
   effectsHead?: WatchEffect
   effectsTail?: WatchEffect
}

function triggerEffects(subject: Watched) {
   // TODO:
   // run sync
   // or schedule
}

interface WatchEffect {
   next: WatchEffect
}










/* INTERNAL */

type AtomicPion = WritableMuon & QuarkyEntity<AtomicPionQuarks> // If a property is non-writable, simply return a derivation function

type MemoizedIon = MemoizedDerivation & QuarkyEntity<MemoizedIonQuarks>

type IonicEffect = () => void/* TODO: */ & QuarkyEntity<IonicEffectQuarks>

type IonizedModel = QuarkyEntity<IonizedModelQuarks>


type IonicWatchEffect = IonicCompound & WatchEffect

function triggerIonicEffect(this: IonicWatchEffect) {
   triggerEffects(this)
}



type IonizedModelQuarks = IonicCompound & Quarks<IonizedModel>




class TrackedOp implements Particle {
   react: (this: Particle, oldState: unknown, newState: unknown) => void
   effects?: Set<WatchEffect> | undefined
   effectsHead?: WatchEffect | undefined
   effectsTail?: WatchEffect | undefined
   compounds?: Set<IonicCompound> | undefined
   compoundsHead?: Link | undefined
   compoundsTail?: Link | undefined
   triggerCompounds: () => void // trigger derivations


} // 'trackable get ops'


class MemoizedIonQuarks implements IonicCompound, Particle, Watched, Quarks<MemoizedIon> {
   react: (this: Particle, oldState: unknown, newState: unknown) => void
   type: string | symbol
   particles: Set<Particle>
   particlesHead: Link | undefined
   particlesTail: Link | undefined
   dirty: boolean
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

class IonicEffectQuarks implements IonicCompound, Watched, Quarks<IonicEffect> {
   trigger: (this: IonicCompound, oldState: unknown, newState: unknown) => void
   type: string | symbol
   particles: Set<Particle>
   particlesHead: Link | undefined
   particlesTail: Link | undefined
   dirty: boolean
   effects: Set<WatchEffect>
   effectsHead: WatchEffect
   effectsTail: WatchEffect
   triggerEffects: () => void
   entity: IonicEffect

}









