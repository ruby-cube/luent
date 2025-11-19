import type { AnyObject } from "@rue/types"
import { __DEV__getTrace } from "../../../flask/debug"
import { EACH, IonicProxy, isIntegerKey } from "./Ionic"
import { Atom, TrackedAtom, trigger } from "../reactivity/Atom"
import { Traceable } from "../debug/Traceable"
import { hasQuark, QUARK, quarkOf } from "../abstract/Quark"
import { AtomicPionQuark, createAtomicPion, InternalPionQuark, PropertyHooks, withTransform } from "./Pion"
import { Constructor, getIonicDef, MethodDef, PropertyDef, TrackableThis, TriggerableThis } from "./IonicMethods"
import { debug, isFunction, isObjectLiteral } from "@rue/utils"
import { TrackedOps, } from "./TrackedOp"
import { track } from "../reactivity/Compound"
import { isIonKey } from "./ionize"
import { CollectiveState, PrivateState } from "../reactivity/State"
import { $activeUpdate, instantUpdate, swiftUpdate, Update } from "../reactivity/Update"
import { withGetHook, withSetHook } from "../ion/AtomicIon"

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
   hooks!: IonicModelHooks | undefined
   extension!: AnyObject | undefined
   config!: AnyObject
   ops: TrackedOps

   private PionQuark = AtomicPionQuark

   constructor(
      public target: AnyObject, //initialData
      private collective: boolean
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
      const Collective = collective ? CollectiveState : PrivateState
      this.state = new Collective(target, (target) => ({ ...target }))  // FIX: standin cloner
      this.ops = new TrackedOps(this)

      if (collective) {
         this.initCollective()
      }
   }

   private initCollective() {
      const hooks = this.hooks
      if (hooks && EACH in hooks && hooks[EACH]) {
         const each = hooks[EACH]
         if ('as' in each && each.as) {
            this.initEach(each.as)
         }
         this.overrideGetPropertyHooks()
      }
   }

   private overrideGetPropertyHooks() {
      let obj = this.state.get(); // TODO: should this be target or state.get() ??
      do {
         const getHookKey = getIonicDef(obj.constructor as Constructor)?.['@getHookKey']
         if (getHookKey) {
            this.getPropertyHooks = (key: PropertyKey) => {
               const hooks = this.hooks
               if (!hooks) return undefined
               const maybeHooks = hooks[key]
               return maybeHooks ?? hooks[getHookKey(key)]
            }
         }
         obj = Object.getPrototypeOf(obj)
      } while (obj && obj.constructor !== Object)
   }


   private getPropertyHooks(key: PropertyKey) {
      return this.hooks?.[key]
   }

   private initEach(transform: (value: unknown) => unknown) {
      let obj = this.state.get(); // TODO: should this be target or state.get() ??
      do {
         const initEach = getIonicDef(obj.constructor as Constructor)?.['@initEach']
         if (initEach) {
            const collection = this.state.get() as any[]
            if (!(Symbol.iterator in collection)) {
               if (__DEV__) console.warn(`Ionic collections must have a '[Symbol.iterator]()' method that returns an iterator.`)
               return;
            }

            let i = 0;
            for (const item of collection) {
               this.state.mutateSync(target => {
                  initEach(item, target, transform, i++)
               })
            }
            this.state.commitUpdate()

         }
         obj = Object.getPrototypeOf(obj)
      } while (obj && obj.constructor !== Object)
   }


   $isExtensible?: () => boolean
   setIsExtensible?: (value: boolean) => boolean

   initIsExtensible() {
      if (this.$isExtensible) return;
      const target = this.target;
      [this.$isExtensible, this.setIsExtensible] = createAtomicPion<boolean>(new InternalPionQuark(Object.isExtensible(target), this, (value) => {
         if (value === true) throw new Error('invalid set')
         Reflect.preventExtensions(target)
      }, this.hooks), undefined, true)
   }


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
      triggerOp(this, INTERNAL_OP, 'ownKeys', update)
      triggerOp(this, '[[in]]', key, update)
      return true;
   }

   protected _initProperty(
      key: PropertyKey
   ) {
      let obj = this.state.get(); // TODO: should this be target or state.get() ??
      do {
         const descriptor = Object.getOwnPropertyDescriptor(obj, key)
         if (descriptor) {
            return this.initializeProperty(key, descriptor, getIonicDef(obj.constructor as Constructor)?.[key])
         }
         obj = Object.getPrototypeOf(obj)
      } while (obj && obj.constructor !== Object)
   }



   protected initializeProperty(
      key: PropertyKey,
      descriptor: PropertyDescriptor,
      def: AnyObject | undefined// TODO:
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
      def: AnyObject | undefined //TODO:
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
         if (__DEV__ && def) console.warn('Custom reactivity not supported for data properties (only accessor properties and methods).')
         return this.initPion(
            key,
            valueKey,
            ionKey,
            value
         )
      }
      else {
         return this.initStaticProperty(
            key,
            value
         )
      }
   }




   protected initPion(
      key: PropertyKey,
      valueKey: PropertyKey,
      ionKey: string | undefined,
      value: unknown
   ) {
      const { proto, target } = this
      if (__DEV__) assertNotFunction(value)
      const hooks = this.getPropertyHooks(valueKey)

      const pionAccess = ionKey && !(ionKey in target) // makes sure not an absorbed ion

      const AtomicPionQuark = this.PionQuark

      const [pion, setPion] = createAtomicPion(new AtomicPionQuark(target, valueKey, this, hooks), hooks?.as, !pionAccess)

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
      def: AnyObject | undefined
   ) {
      const { proto, config, proxy, track, trackModel, trigger, triggerAll, triggerModel } = this
      const descriptor_set = descriptor.set
      const _getter = descriptor.get ?? (() => undefined)
      const _setter = descriptor_set ? ((value: unknown) => { descriptor_set(value); return true; }) : nowrite

      const get = def?.get ? def.get.bind({
         config,
         get raw() { return state.get() },
         get ionic() { return { get [key]() { return _getter.apply(proxy) } } },
         track,
         trackModel
      }) : _getter;

      const set = def?.set ? def.set.bind({
         config,
         get raw() { return state.get() },
         get ionic() { return { set [key](value: unknown) { _setter.apply(proxy, [value]) } } },
         trigger,
         triggerModel,
         triggerAll
      }) : _setter;

      const { as: transform, '@get': castGet, '@set': castSet } = this.getPropertyHooks(valueKey) ?? {} as PropertyHooks

      const getWithHook = castGet ? withGetHook(get, castGet) : get;
      const setWithHook = castSet ? withSetHook<boolean>(set, castSet, () => this.state.get()[valueKey]) : set;

      const [getter, setter] = transform ? withTransform(transform, getWithHook, setWithHook) : [getWithHook, setWithHook]

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
      def: AnyObject | undefined
   ) {
      if (def) {
         if (__DEV__ && !isFunction(def)) console.warn('Invalid method definition')
         const { state, proxy, track, trackModel, trigger, triggerModel, triggerAll, config } = this
         const method = def.bind({
            config,
            get raw() { return state.get() },
            get ionic() { return { [key]: fn.bind(proxy) } },
            track,
            trackModel,
            trigger,
            triggerModel,
            triggerAll
         } satisfies TriggerableThis & TrackableThis)

         return this.proto[key] = {
            get: () => method,
            set: nowrite
         }
      }
      else {
         return this.proto[key] = {
            get: GetBoundMethod(fn, this.proxy),
            set: nowrite
         }
      }
   }

   protected initAbsorbedIon(
      key: string,
      valueKey: string,
      ionKey: string,
      ion: () => unknown,
      def: AnyObject | undefined
   ) {
      const { proto, proxy, target, config, track, trackModel, trigger, triggerAll, triggerModel } = this

      const hooks = this.getPropertyHooks(valueKey)
      const setState = 'value' in ion ? Object.getOwnPropertyDescriptor(ion, 'value')?.set ?? nowrite : nowrite

      const get = def?.get ? def.get.bind({
         config,
         get raw() { return state.get() },
         get ionic() {
            const obj = Object.create(null)
            Object.defineProperty(obj, key, {
               get: ion
            })
            return obj
         },
         track,
         trackModel
      }) : ion

      const set = def?.set ? def.set.bind({
         config,
         get raw() { return state.get() },
         get ionic() {
            const obj = Object.create(null)
            Object.defineProperty(obj, key, {
               set: setState
            })
            return obj
         },
         trigger,
         triggerModel,
         triggerAll
      }) : setState

      const state = proto[valueKey] = {
         get: hooks?.['@get'] ? withGetHook(ion, hooks['@get']) : get,
         set: hooks?.["@set"] ? withSetHook<boolean>(set, hooks['@set'], ion) : set
      }

      const $state = proto[ionKey] = {
         get: !hasQuark(ion) ? GetBoundMethod(ion, proxy) : () => target[ionKey],
         set: nowrite
      }

      return key === ionKey ? $state : state;
   }

   // #endregion

   state: CollectiveState

   private track = (op: PropertyKey, key: unknown) => {
      trackOp(this, op, key)
   }

   private trackModel = () => {
      track(this)
   }

   private trigger = (op: PropertyKey, key: unknown) => {
      const update = this.state.pendingUpdate
      if (update) {
         triggerOp(this, op, key, update)
      }
      else if (__DEV__) {
         throw new Error('must call state.mutate()')
      }
   }

   private triggerModel = () => {
      const update = this.state.pendingUpdate
      if (update) {
         trigger(this, update)
      }
      else if (__DEV__) {
         throw new Error('must call state.mutate()')
      }
   }

   private triggerAll = (op: PropertyKey) => {
      const ops = this.ops.getAllTracked(op)
      if (!ops) return;
      const update = this.state.pendingUpdate
      if (update) {
         for (const [_, trackedOp] of ops) {
            trigger(trackedOp, update)
         }
      }
      else if (__DEV__) {
         throw new Error('must call state.mutate()')
      }
   }
}


function GetBoundMethod(method: Function, proxy: IonicProxy) {
   const boundMethod = method.bind(proxy)
   return () => boundMethod
}

function assertNotFunction(value: unknown) {
   if (isFunction(value)) throw new Error('TypeError: value cannot be a function')
}




type MethodHook = (event: { input: unknown[], output: unknown }) => unknown;

type IonicModelHooks = { [EACH]?: PropertyHooks } & { [key: PropertyKey]: PropertyHooks | MethodHook }

type Overrides = { [key: PropertyKey]: unknown }

type Extender = (proxy: AnyObject) => IonicModelHooks & Overrides

export function createIonicModel(
   target: AnyObject,
   config: IonicModelHooks | Extender
) {
   const modelQuark = new ModelQuark(target)

   const proxy = new Proxy(modelQuark, traps) as any as IonicProxy

   modelQuark.proxy = proxy;
   target[IONIC_PROXY] = proxy;

   const extension = isFunction(config) ? config(proxy) : undefined
   modelQuark.config = config
   modelQuark.hooks = extension ?? config as IonicModelHooks
   modelQuark.extension = extension
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
      trackOp(modelQuark, '[[in]]', key)
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

      trigger(modelQuark, update)
      triggerOp(modelQuark, INTERNAL_OP, 'ownKeys', update)
      triggerOp(modelQuark, '[[in]]', key, update)

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
      triggerOp(modelQuark, INTERNAL_OP, 'ownKeys', update)
      triggerOp(modelQuark, '[[in]]', key, update)

      return true;
   },

   ownKeys(modelQuark) {
      trackOp(modelQuark, INTERNAL_OP, 'ownKeys')
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

function trackOp(
   quark: ModelQuark,
   op: PropertyKey,
   key: unknown
) {
   track(quark.ops.asTracked(op, key))
}

function triggerOp(
   quark: ModelQuark,
   op: PropertyKey,
   key: unknown,
   update: Update
) {
   trigger(quark.ops.getTracked(op, key), update)
}