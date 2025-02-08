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

import { IonicAtom, MaybeIonicAtom } from "../ionic/IonicAtom"
import { Quarks, QuarkyEntity } from "../Quarks"

//ABSTRACT





interface Link {
   atom: IonicAtom,
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





//QUESTION: Should I call these Ions or Muons?

/* API */
export type Muon<T extends NonVoid = NonVoid, M extends Methods = {}> = (() => T) & M

type Methods = { [key: PropertyKey]: (...args: any) => any }

/* API */  // basically writable atomic ions, neutrons, and pions
export type WritableMuon<T extends NonVoid = NonVoid, M extends Methods = {}> = Muon<T> & {
   state: T
} & M

/* API */
// export type MemoizedDerivation<T extends NonVoid = NonVoid, M extends Methods = {}> = Muon<T> & {
//    untrack: () => void //TODO: rename to something else or eliminate
// } & M



/* INTERNAL */

type NonVoid = string | number | object | undefined | boolean | bigint | symbol | null



type AtomicPion = WritableMuon & QuarkyEntity<AtomicPionQuarks> // If a property is non-writable, simply return a derivation function

type MemoizedIon = MemoizedDerivation & QuarkyEntity<MemoizedIonQuarks>

type IonicEffect = () => void/* TODO: */ & QuarkyEntity<IonicEffectQuarks>

type IonizedModel = QuarkyEntity<IonizedModelQuarks>


type IonicWatchEffect = IonicCompound & WatchEffect

function triggerIonicEffect(this: IonicWatchEffect) {
   triggerEffects(this)
}



type IonizedModelQuarks = IonicCompound & Quarks<IonizedModel>

export function triggerIonizedModel(
   this: IonizedModelQuarks,
   op: string,
   args: any[],
   output: any,
   preopData?: any
) {
   if (this.effects) {
      triggerEffects.call(this)

      useRenderCycle().recordOp(this.entity, {
         target: this.entity,
         op,
         args,
         output,
         preopData
      })
   }
}



class TrackedOp implements IonicAtom {
   react: (this: IonicAtom, oldState: unknown, newState: unknown) => void
   effects?: Set<WatchEffect> | undefined
   effectsHead?: WatchEffect | undefined
   effectsTail?: WatchEffect | undefined
   compounds?: Set<IonicCompound> | undefined
   compoundsHead?: Link | undefined
   compoundsTail?: Link | undefined
   triggerCompounds: () => void // trigger derivations


} // 'trackable get ops'


class MemoizedIonQuarks implements IonicCompound, IonicAtom, Watched, Quarks<MemoizedIon> {
   react: (this: IonicAtom, oldState: unknown, newState: unknown) => void
   type: string | symbol
   atoms: Set<IonicAtom>
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
   atoms: Set<IonicAtom>
   particlesHead: Link | undefined
   particlesTail: Link | undefined
   dirty: boolean
   effects: Set<WatchEffect>
   effectsHead: WatchEffect
   effectsTail: WatchEffect
   triggerEffects: () => void
   entity: IonicEffect

}









