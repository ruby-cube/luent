import { AnyObject } from "@rue/types"
import { ModelQuark } from "./IonicModel"
import { PionState, SimpleState } from "../reactivity/State"
import { AtomicIonQuark, getState, setState } from "../ion/AtomicIon"
import { trigger } from "../reactivity/Atom"
import { CollectiveQuark } from "./IonicCollective"
import { QUARK } from "../abstract/Quark"



export type PropertyHooks = {
   as?: (value: unknown) => unknown,
   '@get'?: (value: unknown) => void,
   '@set'?: (event: { value: unknown, previous: unknown }) => void
}

export function createAtomicPion(
   quark: AtomicPionQuark,
   hooks: PropertyHooks | undefined,
   internal: boolean = false
) {
   const transform = hooks?.as
   const castGet = hooks?.["@get"]
   const castSet = hooks?.["@set"]

   let initialState = true;
   const $state = () => {
      const value = getState.apply(quark)
      castGet?.(value)
      return initialState ? transform?.(value) : value
   }
   const setState = (value: unknown) => {
      initialState = false;
      const previous = quark.state.get()
      const output = setPion.apply(quark, [value])
      castSet?.({ value, previous })
      return output
   }

   if (internal) return [$state, setState] as const

   $state[QUARK] = quark
   $state.displayName = 'getPropertyValue'
   Object.defineProperty($state, 'value', {
      get: $state,
      set: setState
   })

   return [$state, setState] as const
}





// export function createInternalPion<T>(
//    quark: AtomicPionQuark,
//    hooks: PropertyHooks | undefined
// ) {
//    const transform = hooks?.as
//    const castGet = hooks?.["@get"]
//    const castSet = hooks?.["@set"]

//    let initialState = true;
//    const $state = () => {
//       const value = getState.apply(quark)
//       castGet?.(value)
//       return initialState ? transform?.(value) : value
//    }
//    const setState = (value: unknown) => {
//       initialState = false;
//       const previous = quark.state.get()
//       const output = setPion.apply(quark, [value])
//       castSet?.({ value, previous })
//       return output
//    }
//    return [$state, setState] as [() => T, (value: T) => T]
// }


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

