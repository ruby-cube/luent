import { AnyObject } from "@rue/types"
import { ModelQuark } from "./IonicModel"
import { PionState, SimpleState } from "../reactivity/State"
import { AtomicIonQuark, getState, IonHooks, setState } from "../ion/AtomicIon"
import { trigger } from "../reactivity/Atom"
import { CollectiveQuark } from "./IonicCollective"
import { QUARK } from "../abstract/Quark"



export type PropertyHooks = {
   as?: (value: unknown) => unknown
} & IonHooks

/**
 * NOTE: We auto-transform only for initial values to 
 * prevent unexpected behavior like 
 * obj.a = a
 * console.log(a === obj.a) // false because a is raw and obj.a is ionic
 */
export function createAtomicPion(
   quark: AtomicPionQuark,
   transform: ((value: unknown) => unknown) | undefined,
   internal: boolean = false
) {
   let initialState = true;
   const $state = () => {
      const value = getState.apply(quark)
      // castGet?.(value)
      return initialState ? transform?.(value) : value
   }

   const setState = (value: unknown) => {
      initialState = false;
      // const previous = quark.state.get()
      return setPion.apply(quark, [value])
      // castSet?.({ value, previous })
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
      public collectiveQuark: ModelQuark,
      hooks: PropertyHooks | undefined
   ) {
      super(new PionState(target[key], (value) => { target[key] = value }), hooks)
   }
}

export class CollectivePionQuark extends AtomicIonQuark {
   constructor(
      target: AnyObject,
      key: PropertyKey,
      public collectiveQuark: CollectiveQuark,
      hooks: PropertyHooks | undefined
   ) {
      const collectiveState = collectiveQuark.state
      super(new PionState(target[key], (value) => { collectiveState.mutate(target => target[key] = value) }), hooks)
   }
}

export class InternalPionQuark extends AtomicIonQuark {
   constructor(
      initialValue: unknown,
      public collectiveQuark: ModelQuark,
      onCommit: (value: unknown) => void,
      hooks: PropertyHooks | undefined
   ) {
      super(new PionState(initialValue, onCommit), hooks)
   }
}

