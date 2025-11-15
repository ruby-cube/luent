import { AnyObject } from "@rue/types"
import { ModelQuark } from "./IonicModel"
import { PionState, SimpleState } from "../reactivity/State"
import { AtomicIonQuark, getState, setState } from "../ion/AtomicIon"
import { trigger } from "../reactivity/Atom"
import { CollectiveQuark } from "./IonicCollective"





export function createAtomicPion(
   target: AnyObject,
   key: PropertyKey,
   quark: AtomicPionQuark
) {
   const $state = getState.bind(quark)
   const setState = setPion.bind(quark)
   //@ts-expect-error
   $state[QUARK] = quark
   //@ts-expect-error
   $state.displayName = 'getPropertyValue'
   Object.defineProperty($state, 'value', {
      get: $state,
      set: setState
   })

   return [$state, setState] as const
}





export function createInternalPion<T>(
   quark: AtomicPionQuark
) {
   return [getState.bind(quark), setPion.bind(quark)] as [() =>T, (value: T) =>T]
}


export function setPion(this: AtomicPionQuark, value: unknown) {
   setState.apply(this, [value])
   trigger(this.collectiveQuark, this.state.pendingUpdate!)
   return value;
}


export class AtomicPionQuark extends AtomicIonQuark {
   constructor(
      target: AnyObject,
      key: PropertyKey,
      public collectiveQuark: ModelQuark
   ) {
      super(new PionState(target[key], (value) => { target[key] = value }))
   }
}

export class CollectivePionQuark extends AtomicIonQuark {
   constructor(
      target: AnyObject,
      key: PropertyKey,
      public collectiveQuark: CollectiveQuark
   ) {
      const collectiveState = collectiveQuark.state
      super(new PionState(target[key], (value) => { collectiveState.mutate(target => target[key] = value) }))
   }
}

export class InternalPionQuark extends AtomicIonQuark {
   constructor(
      initialValue: unknown,
      public collectiveQuark: ModelQuark,
      onCommit: (value: unknown) => void
   ) {
      super(new PionState(initialValue, onCommit))
   }
}

