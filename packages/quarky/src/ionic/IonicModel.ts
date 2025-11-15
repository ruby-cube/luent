import type { AnyObject } from "@rue/types"
import { __DEV__getTrace } from "../../../flask/debug"
import { IonicProxy } from "./Ionic"
import { Atom, TrackedAtom, trigger } from "../reactivity/Atom"
import { Traceable } from "../debug/Traceable"
import { hasQuark, QUARK } from "../abstract/Quark"
import { AtomicPionQuark, createAtomicPion, createInternalPion, InternalPionQuark } from "./Pion"
import { trackOp } from "./IonicMethods"
import { debug, isFunction } from "@rue/utils"
import { asTrackedOp, getTrackedOp, TrackedOpQuark, TrackedOps } from "./TrackableOp"
import { track } from "../reactivity/Compound"
import { isIonKey } from "./ionize"
import { CollectiveState, PrivateState } from "../reactivity/State"
import { $activeUpdate } from "../reactivity/Update"

export type Proto = {
   [key: PropertyKey]: {
      get: () => unknown,
      set: (value: unknown) => boolean
   },
}

const IONIC_PROXY = Symbol('ionicProxy')
const IONIZED_MODEL = 'ionized model' as const

function nowrite(value: unknown) {
   return false;
}

export class ModelQuark implements Atom {
   __DEV__asTraceable: Traceable = new Traceable()
   quarkType = IONIZED_MODEL
   asTrackedAtom: TrackedAtom | undefined
   proto: Proto
   proxy!: IonicProxy

   constructor(
      public target: AnyObject, //initialData
      public config: AnyObject
   ) {
      this.proto = Object.create(target, {
         [QUARK]: { value: { get: () => this, set: nowrite } },
         constructor: { value: { get: () => target.constructor, set: nowrite } }
         // TODO: 
         // hasOwnProperty
         // isPrototypeOf
         // propertyIsEnumerable
         // toLocaleString
         // toString
         // valueOf
      })

      // TODO: for collective state this will be the CollectiveState
      this.state = new PrivateState(this.target, (target) => ({ ...target })) // FIX: standin cloner
   }

   $isExtensible?: () => boolean
   setIsExtensible?: (value: boolean) => boolean

   initIsExtensible() {
      if (this.$isExtensible) return;
      const target = this.target;
      [this.$isExtensible, this.setIsExtensible] = createInternalPion<boolean>(new InternalPionQuark(Object.isExtensible(target), this, (value) => {
         if (value === true) throw new Error('invalid set')
         Reflect.preventExtensions(target)
      }))
   }


   // #region:

   trackedOps: Record<PropertyKey, TrackedOps> = {
      '[[in]]': new Map()
   }

   registerOp(key: PropertyKey, entryKey: any, trackedOp: TrackedOpQuark) {
      const ops = this.trackedOps[key] ?? new Map();
      if (!(ops instanceof Map)) {
         debug.error(`${String(key)} is not an op`)
         return trackedOp;
      }
      this.trackedOps[key] = ops;
      ops.set(entryKey, trackedOp)
      return trackedOp;
   }

   // #endregion

   // #region:

   initProperty(
      key: PropertyKey
   ) {
      if (!(key in this.state.get())) {
         return this.initNonProperty(key)
      }
      return this._initProperty(key)
   }

   // for cases where a property is read/tracked that might be added later, e.g. an array index
   initNonProperty(
      key: PropertyKey
   ) {
      if (!Object.isExtensible(this.target)) return;
      const valueKey = isIonKey(key) ? key.slice(1) : key
      const ionKey = key === valueKey && typeof key === 'string' ? '$' + key : undefined
      return this.initPion(key, valueKey, ionKey, undefined)
   }


   setNewProperty(
      key: PropertyKey,
      value: unknown
   ) {
      if (!Object.isExtensible(this.target)) return false;
      if (isFunction(value)) {
         if (__DEV__) console.warn(`Adding new methods or absorbed ions to a proxy is not supported. You must add ${value} to the raw object before ionizing it`)
         return false;
      }
      const update = $activeUpdate()
      if (!update) return false;
      const success = this.state.mutate(target => Reflect.set(target, key, value))
      if (!success) return false;
      const set = this.proto.setters
      if (!(key in set)) this.initNonProperty(key)
      trigger(getTrackedOp(this, INTERNAL_OP, 'ownKeys'), update)
      trigger(getTrackedOp(this, '[[in]]', key), update)
      return true;
   }

   protected _initProperty(
      key: PropertyKey
   ) {
      let obj = this.state.get(); // TODO: should this be target or state.get() ??
      do {
         const descriptor = Object.getOwnPropertyDescriptor(obj, key)
         if (descriptor) {
            return this.initializeProperty(key, descriptor, getIonicOpDef(obj.constructor))
         }
         obj = Object.getPrototypeOf(obj)
      } while (obj && obj.constructor !== Object)
   }



   protected initializeProperty(
      key: PropertyKey,
      descriptor: PropertyDescriptor,
      def: AnyObject // TODO:
   ) {
      const valueKey = isIonKey(key) ? key.slice(1) : key
      const ionKey = key === valueKey && typeof key === 'string' ? '$' + key : undefined
      if ('value' in descriptor) {
         return this.initValueProperty(
            key,
            valueKey,
            ionKey,
            descriptor,
            def
         )
      }
      else {
         return this.initDerivedProperty(
            key,
            valueKey,
            key === valueKey ? ionKey : undefined,
            descriptor,
            def
         )
      }
   }

   protected initValueProperty(
      key: PropertyKey,
      valueKey: PropertyKey,
      ionKey: string | undefined,
      descriptor: { value?: unknown, writable?: boolean },
      def: AnyObject //TODO:
   ) {
      const { value, writable } = descriptor
      if (isFunction(value) && key === ionKey && value.length == 0) {
         return this.initAbsorbedIon(
            key,
            valueKey as string,
            ionKey,
            value,
            def
         )
      }
      else if (isFunction(value)) {
         return this.initMethod(
            key,
            value,
            def
         )
      }
      else if (key === valueKey && writable) {
         return this.initPion(
            key,
            valueKey,
            ionKey,
            value,
            def
         )
      }
      else {
         return this.initStaticProperty(
            key,
            value
         )
      }
   }

   private PionQuark = AtomicPionQuark

   protected initPion(
      key: PropertyKey,
      valueKey: PropertyKey,
      ionKey: string | undefined,
      value: unknown,
      def: AnyObject
   ) {
      // TODO: ionic config
      // TODO: ionic structure def

      const { proto, target, config } = this
      if (__DEV__) assertNotFunction(value)
      const pionAccess = ionKey && !(ionKey in target) // makes sure not an absorbed ion

      const AtomicPionQuark = this.PionQuark

      const [pion, setPion] =
         pionAccess
            ? createAtomicPion(target, valueKey, new AtomicPionQuark(target, valueKey, this))
            : createInternalPion(new AtomicPionQuark(target, valueKey, this))

      const state = proto[valueKey] = {
         get: pion,
         set: (value) => { setPion(value); return true; }
      };

      const $state = pionAccess ? (proto[ionKey] = {
         get: () => pion,
         set: nowrite
      }) : undefined

      return key === ionKey ? $state : state
   }

   protected initStaticProperty(
      key: PropertyKey,
      value: unknown,
   ) {
      return this.proto[key] = {
         get: () => value,
         set: nowrite
      }
   }


   protected initDerivedProperty(
      key: PropertyKey,
      valueKey: PropertyKey,
      ionKey: string | undefined,
      descriptor: PropertyDescriptor,
      def: AnyObject
   ) {
      const { proto } = this
      const { get, set } = descriptor
      const getter = get ?? (() => undefined)
      const setter = set ? ((value: unknown) => { set(value); return true; }) : nowrite
      const state = proto[valueKey] = {
         get: getter,
         set: setter
      }
      const $state = ionKey ? (proto[ionKey] = {
         get: PionAccess(getter, setter),
         set: nowrite
      }) : undefined

      function PionAccess(getter: () => unknown, setter: (value: unknown) => unknown) {
         const pion = () => getter() // we wrap in case getter is a shared reference
         Object.defineProperty(pion, 'value', {
            get: getter,
            set: setter
         })
         return () => pion;
      }

      return key === ionKey ? $state : state
   }

   protected initMethod(
      key: PropertyKey,
      fn: Function,
      def: AnyObject
   ) {
      this.proto[key] = {
         get: GetBoundMethod(fn, this.proxy),
         set: nowrite
      }
   }

   protected initAbsorbedIon(
      key: string,
      valueKey: string,
      ionKey: string,
      ion: () => unknown,
      def: AnyObject
   ) {
      const { proto, proxy, target } = this

      const state = proto[valueKey] = {
         get: ion,
         set: 'value' in ion ? (value: unknown) => { ion.value = value; return true } : nowrite
      }

      const $state = proto[ionKey] = {
         get: !hasQuark(ion) ? GetBoundMethod(ion, proxy) : () => target[ionKey],
         set: nowrite
      }

      return key === ionKey ? $state : state;
   }

   // #endregion

   state: CollectiveState
}


function GetBoundMethod(method: Function, proxy: IonicProxy) {
   const boundMethod = method.bind(proxy)
   return () => boundMethod
}

function assertNotFunction(value: unknown) {
   if (isFunction(value)) throw new Error('TypeError: value cannot be a function')
}

export function createIonicModel(
   target: AnyObject,
   config: AnyObject // TODO:
) {
   const modelQuark = new ModelQuark(target, config)

   const proxy = new Proxy(modelQuark, traps) as any as IonicProxy

   modelQuark.proxy = proxy;
   target[IONIC_PROXY] = proxy;
   return proxy
}



const INTERNAL_OP = "[[INTERNAL]]"

const traps: ProxyHandler<ModelQuark> = {

   get(modelQuark, key, receiver) {
      __DEV__assertNotPrototype(modelQuark.proxy, receiver)
      const proto = modelQuark.proto
      if (!(key in proto)) {
         return modelQuark.initProperty(key)?.get()
      }
      return proto[key].get()
   },

   set(modelQuark, key, newValue, receiver) {
      __DEV__assertNotPrototype(modelQuark.proxy, receiver)
      const proto = modelQuark.proto
      if (!(key in proto) && !(key in modelQuark.state.get())) {
         return modelQuark.setNewProperty(key, newValue) // FIX: what if property was set in a preceding update that hasn't committed?
      }
      if (!(key in proto))
         return Boolean(modelQuark.initProperty(key)?.set(newValue))
      return proto[key].set(newValue)
   },



   has(modelQuark, key) {
      if (key === QUARK) return true;
      const get = modelQuark.proto.getters
      if (!(key in get)) modelQuark.initProperty(key)
      track(asTrackedOp(modelQuark, '[[in]]', key))
      return key in get
   },

   getOwnPropertyDescriptor(modelQuark, key) {
      if (modelQuark.state.get()) {
         modelQuark.proxy[key] // tracks property
      }
      return Object.getOwnPropertyDescriptor(modelQuark.state.get(), key)
   },

   defineProperty(modelQuark, key, descriptor) {
      if (key in modelQuark.state.get()) { // FIX: should this check both state.current and state.pending??
         if (__DEV__) console.warn(`Redefining property of an ionic proxy not supported`)
         return false
      }
      const update = $activeUpdate()
      if (!update) return false;

      // FIX: what if property was set in a preceding update that hasn't committed?
      const success = modelQuark.state.mutate(target => Reflect.defineProperty(target, key, descriptor))
      if (!success) return false;

      trigger(getTrackedOp(modelQuark, INTERNAL_OP, 'ownKeys'), update)
      trigger(getTrackedOp(modelQuark, '[[in]]', key), update)
      trigger(modelQuark, update)

      return true;
   },

   deleteProperty(modelQuark, key) {
      const update = $activeUpdate()
      if (!update) return false;

      const success = modelQuark.state.mutate(target => Reflect.deleteProperty(target, key))
      if (!success) return false;

      const proto = modelQuark.proto
      if (key in proto) {
         // set/trigger pion
         proto[key].set(undefined)

         // update proto
         update.atCommit(() => {
            delete proto[key]
         })
      }

      trigger(modelQuark, update)
      trigger(getTrackedOp(modelQuark, INTERNAL_OP, 'ownKeys'), update)
      trigger(getTrackedOp(modelQuark, '[[in]]', key), update)

      return true;
   },

   ownKeys(modelQuark) {
      track(asTrackedOp(modelQuark, INTERNAL_OP, 'ownKeys')) // TODO: trigger when any new property is added or deleted
      return Reflect.ownKeys(modelQuark.state.get())
   },

   getPrototypeOf(modelQuark) {
      return Reflect.getPrototypeOf(modelQuark.target)
   },

   setPrototypeOf(target, proto) {
      debug.warn("[DISALLOWED] Cannot setPrototypeOf ionized model")
      return false
   },

   isExtensible(modelQuark) {
      modelQuark.initIsExtensible()
      return modelQuark.$isExtensible!()
   },

   preventExtensions(modelQuark) {
      modelQuark.initIsExtensible()
      return modelQuark.setIsExtensible!(false)
   },
}

export function __DEV__assertNotPrototype(proxy: IonicProxy, receiver: AnyObject) {
   if (proxy !== receiver) throw new Error('An ionic model may not serve as a prototype. Construct inheritance tree from raw classes')
}