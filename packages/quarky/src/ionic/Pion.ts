import { SimpleState } from "../reactivity/State"
import { AtomicIonQuark, getState, IonHooks, setState, withGetHook, withSetHook } from "../ion/AtomicIon"
import { trigger } from "../reactivity/Atom"
import { QUARK } from "../abstract/Quark"
import { ModelQuark } from "./ModelQuark"
import { isObject } from "@rue/utils"
import { $activeUpdate } from "../reactivity/Update"



export type PropertyHooks = {
   '-as'?: (value: unknown) => unknown;
} & IonHooks

/**
 * NOTE: We auto-transform only for initial values to 
 * prevent unexpected behavior like 
 * obj.a = a
 * console.log(a === obj.a) // false because a is raw and obj.a is ionic
 */
export function createAtomicPion<T = unknown>(
   quark: AtomicPionQuark,
   transform: ((value: any) => unknown) | undefined,
   internal: boolean = false
): [() => T, (value: T) => T] {
   const get = quark.castGet ? withGetHook(getState.bind(quark), quark.castGet) : function () { return getState.apply(quark) }
   const set = quark.castSet ? withSetHook(setPion.bind(quark), quark.castSet, () => quark.state.get()) : setPion.bind(quark)
   const wrapped = transform ? withTransform(transform, get, set) : [get, set] as const

   if (internal) return wrapped as [() => T, (value: T) => T]

   const [$state, setState] = wrapped

   if ( __DEV__) {
      // @ts-expect-error
      $state.displayName = 'getPropertyValue'
   }

   // @ts-expect-error
   $state[QUARK] = quark
   Object.defineProperty($state, 'value', {
      get: $state,
      set: setState
   })

   return [$state, setState] as [() => T, (value: T) => T]
}

export function withTransform<T>(transform: (value: any) => unknown, get: () => unknown, set: (value: unknown) => T) {
   let initialState = true;

   function $state() {
      const value = get()
      return initialState && isObject(value) ? transform(value) : value
   }
   // preserve monomorphism
   $state.value = undefined
   $state[QUARK] = undefined

   function setState(value: unknown) {
      initialState = false
      return set(value)
   }
   return [$state, setState] as const
}



export function setPion(this: AtomicPionQuark, value: unknown) {
   setState.apply(this, [value])
   trigger(this.modelQuark, this.state.pendingUpdate!)
   return value;
}


export class AtomicPionQuark extends AtomicIonQuark {
   constructor(
      initialValue: unknown,
      public modelQuark: ModelQuark,
      hooks: PropertyHooks | undefined
   ) {
      super(new SimpleState(initialValue), hooks, modelQuark.__DEV__asTraceable)
   }
}

// export class CollectivePionQuark extends AtomicIonQuark {
//    constructor(
//       target: AnyObject,
//       key: PropertyKey,
//       public modelQuark: ModelQuark,
//       hooks: PropertyHooks | undefined
//    ) {
//       const collectiveState = modelQuark.state
//       super(new PionState(target[key], (value) => { 
//          return collectiveState.mutate(target => target[key] = value); // FIX: should this be mutateSync?
//          // collectiveState.commitUpdate() 
//       }), hooks, modelQuark.__DEV__asTraceable)
//    }
// }


// export class InternalPionQuark extends AtomicIonQuark {
//    constructor(
//       initialValue: unknown,
//       public modelQuark: ModelQuark,
//       hooks: PropertyHooks | undefined
//    ) {
//       super(new SimpleState(initialValue), hooks)
//    }
// }

