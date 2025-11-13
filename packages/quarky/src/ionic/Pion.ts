import { AnyObject } from "@rue/types"
import { hasQuark } from "../abstract/Quark"
import { ModelQuark } from "./IonicModel"
import { IonicProxy } from "./Ionic"
import { isFunction } from "@rue/utils"
import { isIonKey } from "./ionize"
import { SimpleState } from "../reactivity/State"
import { AtomicIonQuark, getState, setState } from "../ion/AtomicIon"
import { trigger } from "../reactivity/Atom"


// class PionState extends SimpleState {
//    constructor(
//       private target: AnyObject,
//       private key: PropertyKey
//    ) {
//       super(target[key])
//    }

//    override commitUpdate(): void {
//       this.target[this.key] = super.commitUpdate()
//    }
// }

// class InternalPionState extends SimpleState {
//    constructor(
//       private target: AnyObject,
//       private key: PropertyKey,
//       private onCommit: () => void
//    ) {
//       super(target[key])
//    }

//       override commitUpdate(): void {
//       this.target[this.key] = super.commitUpdate()
//    }
// }


function createAtomicPion(
   target: AnyObject,
   key: PropertyKey,
   modelQuark: ModelQuark
) {
   const quark = new AtomicPionQuark(target, key, modelQuark)
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



export function createInternalPion(
   quark: AtomicPionQuark
) {
   return [getState.bind(quark), setPion.bind(quark)]
}


export function setPion(this: AtomicPionQuark, value: unknown) {
   setState.apply(this, [value])
   trigger(this.modelQuark, this.state.pendingUpdate!)
}


class AtomicPionQuark extends AtomicIonQuark {
   constructor(
      target: AnyObject,
      key: PropertyKey,
      public modelQuark: ModelQuark
   ) {
      super(new SimpleState(target[key], (value) => { target[key] = value }))
   }
}

export class InternalPionQuark extends AtomicIonQuark {
   constructor(
      initialValue: unknown,
      public modelQuark: ModelQuark,
      onCommit: (value: unknown) => void
   ) {
      super(new SimpleState(initialValue, onCommit))
   }
}



export function initializeProperty(
   modelQuark: ModelQuark,
   key: PropertyKey,
   descriptor: PropertyDescriptor,
) {
   const valueKey = isIonKey(key) ? key.slice(1) : key
   const ionKey = key === valueKey && typeof key === 'string' ? '$' + key : undefined
   if ('value' in descriptor) {
      initDataProperty(
         modelQuark,
         key,
         valueKey,
         ionKey,
         descriptor
      )
   }
   else {
      initAccessorProperty(
         modelQuark,
         key,
         key === valueKey ? ionKey : undefined,
         descriptor
      )
   }
}

function initDataProperty(
   modelQuark: ModelQuark,
   key: PropertyKey,
   valueKey: PropertyKey,
   ionKey: string | undefined,
   descriptor: { value?: unknown, writable?: boolean }
) {
   const { value, writable } = descriptor
   if (isFunction(value) && key === ionKey && value.length == 0) {
      initAbsorbedIon(
         modelQuark,
         valueKey as string,
         ionKey,
         value,
      )
   }
   else if (isFunction(value)) {
      initMethod(
         modelQuark,
         key,
         value,
      )
   }
   else if (key === valueKey && writable) {
      initPion(
         modelQuark,
         valueKey,
         ionKey,
         value
      )
   }
   else {
      initStaticProperty(
         modelQuark,
         key,
         value
      )
   }
}



function assertNotFunction(value: unknown) {
   if (isFunction(value)) throw new Error('TypeError: value cannot be a function')
}

export function initPion(
   modelQuark: ModelQuark,
   key: PropertyKey,
   ionKey: string | undefined,
   value: unknown,
) {
   const { proto, target } = modelQuark
   if (__DEV__) assertNotFunction(value)
   const pionAccess = ionKey && !(ionKey in target)

   const [pion, setPion] =
      pionAccess
         ? createAtomicPion(target, key, modelQuark)
         : createInternalPion(new AtomicPionQuark(target, key, modelQuark))

   proto.getters[key] = pion;
   proto.setters[key] = setPion;

   if (pionAccess) {
      proto.getters[ionKey] = () => pion
      proto.setters[ionKey] = (value: unknown) => false
   }
}

function initStaticProperty(
   modelQuark: ModelQuark,
   key: PropertyKey,
   value: unknown,
) {
   const { proto } = modelQuark
   proto.getters[key] = () => value
   proto.setters[key] = (value: unknown) => false
}


function initAccessorProperty(
   modelQuark: ModelQuark,
   key: PropertyKey,
   ionKey: string | undefined,
   descriptor: PropertyDescriptor
) {
   const { proto, target } = modelQuark
   const getter = proto.getters[key] = descriptor.get ?? (() => undefined)
   const setter = proto.setters[key] = descriptor.set ?? ((value: unknown) => { })
   if (ionKey) {
      const pion = () => getter()
      Object.defineProperty(pion, 'value', {
         get: getter,
         set: setter
      })
      proto.getters[ionKey] = () => pion
      proto.setters[ionKey] = (value: unknown) => false
   }
}

function initMethod(
   modelQuark: ModelQuark,
   key: PropertyKey,
   fn: Function,
) {
   const { proto, proxy } = modelQuark
   proto.getters[key] = GetBoundMethod(fn, proxy)
   proto.setters[key] = (value: unknown) => false
}

function initAbsorbedIon(
   modelQuark: ModelQuark,
   key: string,
   ionKey: string,
   ion: Function,
) {
   const { proto, proxy, target } = modelQuark
   proto.getters[key] = ion
   proto.setters[key] = 'value' in ion ? (value: unknown) => ion.value = value : (value: undefined) => false

   proto.getters[ionKey] = !hasQuark(ion) ? GetBoundMethod(ion, proxy) : () => target[ionKey]
   proto.setters[ionKey] = (value: unknown) => false
}

function GetBoundMethod(method: Function, proxy: IonicProxy) {
   const boundMethod = method.bind(proxy)
   return () => boundMethod
}