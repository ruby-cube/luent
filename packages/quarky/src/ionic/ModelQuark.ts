import { isFunction, isObject } from "@rue/utils"
import { Atom, TrackedAtom, trigger } from "../reactivity/Atom"
import { track } from "../reactivity/Compound"
import { CollectiveState, PrivateState } from "../reactivity/State"
import { hasQuark, QUARK, quarkOf } from "../abstract/Quark"
import { withGetHook, withSetHook } from "../ion/AtomicIon"
import { AnyObject } from "@rue/types"
import { Constructor, CustomThis, getIonicDef, TrackableThis, TriggerableThis } from "./IonicDef"
import { AtomicPionQuark, createAtomicPion, InternalPionQuark, PropertyHooks, withTransform } from "./Pion"
import { EACH, INTERNAL_OP, IonicProxy } from "./Ionic"
import { $activeUpdate, Update } from "../reactivity/Update"
import { TrackedOps } from "./TrackedOp"
import { Traceable } from "../debug/Traceable"
import { IonicModelHooks } from "./IonicModel"

export type QuarkyIonicProxy = AnyObject & { [QUARK]: ModelQuark }
export type Proto = Map<ProxyKey, PropertyAccess>

type PropertyAccess = {
   get: () => unknown,
   set: (value: unknown) => boolean
}

export type ProxyKey = string | symbol

const IONIZED_MODEL = 'ionized model' as const

function nowrite(value: unknown) {
   return false;
}


type CloneFn = (entity: any) => any
function getCloner(entity: object): CloneFn {
   // TODO: get cloner from data structure configs
   if (entity instanceof Array) return (entity: any[]) => {
      return Object.assign([], entity)
   }
   if (entity instanceof Date) return (entity: Date) => {
      return Object.assign(new Date(entity), entity)
   }
   if (entity instanceof Set) return (entity: Set<any>) => {
      return Object.assign(new Set(entity), entity)
   }
   if (entity instanceof Map) return (entity: Map<any, any>) => {
      return Object.assign(new Map(entity), entity)
   }
   return (entity: object) => {
      return Object.create(Object.getPrototypeOf(entity), Object.getOwnPropertyDescriptors(entity))
   }
}


export class ModelQuark implements Atom {
   __DEV__asTraceable: Traceable = new Traceable()
   quarkType = IONIZED_MODEL
   asTrackedAtom: TrackedAtom | undefined
   proto: Proto
   proxy!: QuarkyIonicProxy
   hooks!: IonicModelHooks | undefined
   extension!: AnyObject | undefined
   config!: AnyObject
   ops: TrackedOps

   private PionQuark = AtomicPionQuark

   constructor(
      public target: AnyObject, //initialData
      collective: boolean | 'collection' = false
   ) {
      this.proto = new Map<ProxyKey, PropertyAccess>([
         [QUARK, {
            get: () => this,
            set: nowrite
         }],
         ['constructor', {
            get: () => target.constructor,
            set: nowrite
         }],
         ['isPrototypeOf', {
            get: GetBoundMethod(target.isPrototypeOf, target),
            set: nowrite
         }]
      ])

      // TODO: 
      // hasOwnProperty
      // propertyIsEnumerable
      // toLocaleString
      // toString
      // valueOf

      const Collective = collective ? CollectiveState : PrivateState
      this.state = new Collective(target, getCloner(target))  // FIX: standin cloner
      this.ops = new TrackedOps(this)

      if (collective === 'collection') {
         this.initCollection()
      }
   }

   private initCollection() {
      const hooks = this.hooks
      if (hooks && EACH in hooks && hooks[EACH]) {
         const each = hooks[EACH]
         if ('as' in each && each.as) {
            this.initEach(each.as)
            delete each.as
         }
         this.overrideGetPropertyHooks()
      }
   }

   private overrideGetPropertyHooks() {
      let obj = this.state.get(); // TODO: should this be target or state.get() ??
      do {
         const getHookKey = getIonicDef(obj.constructor as Constructor)?.hooks?.['@getHookKey']
         if (getHookKey) {
            this.getPropertyHooks = (key: ProxyKey) => {
               const hooks = this.hooks
               if (!hooks) return undefined
               const maybeHooks = hooks[key]
               return (maybeHooks ?? hooks[getHookKey(key)]) as PropertyHooks | undefined
            }
         }
         obj = Object.getPrototypeOf(obj)
      } while (obj && obj.constructor !== Object)
   }


   private getPropertyHooks(key: ProxyKey): PropertyHooks | undefined {
      return this.hooks?.[key] as PropertyHooks
   }

   private initEach(transform: (value: unknown) => unknown) {
      let obj = this.state.get(); // TODO: should this be target or state.get() ??
      do {
         const initEach = getIonicDef(obj.constructor as Constructor)?.hooks?.['@initEach']
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
      }, undefined), undefined, true)
   }


   // #region:

   initProperty(
      key: ProxyKey
   ) {
      if (!(key in this.state.get())) {
         return this.initNonProperty(key)
      }
      return this._initProperty(key)
   }

   // for cases where a property is read/tracked that might be added later, e.g. an array index
   initNonProperty(
      key: ProxyKey
   ) {
      if (!Object.isExtensible(this.target)) return;
      const valueKey = isIonKey(key) ? key.slice(1) : key
      const ionKey = key === valueKey && typeof key === 'string' ? '$' + key : undefined
      return this.initPion(key, valueKey, ionKey, undefined)
   }


   setNewProperty(
      key: ProxyKey,
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
      if (!this.proto.has(key)) this.initNonProperty(key)
      triggerOp(this, INTERNAL_OP, 'ownKeys', update)
      triggerOp(this, '[[in]]', key, update)
      return true;
   }

   protected _initProperty(
      key: ProxyKey
   ) {
      let obj = this.state.get(); // TODO: should this be target or state.get() ??
      do {
         const descriptor = Object.getOwnPropertyDescriptor(obj, key)
         if (descriptor) {
            return this.initializeProperty(key, descriptor, getIonicDef(obj.constructor as Constructor)?.def?.[key])
         }
         obj = Object.getPrototypeOf(obj)
      } while (obj && obj.constructor !== Object)
   }



   protected initializeProperty(
      key: ProxyKey,
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
      key: ProxyKey,
      valueKey: ProxyKey,
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
      key: ProxyKey,
      valueKey: ProxyKey,
      ionKey: string | undefined,
      value: unknown
   ) {
      const { proto, target } = this
      if (__DEV__) assertNotFunction(value)
      const hooks = this.getPropertyHooks(valueKey)

      const pionAccess = ionKey && !(ionKey in target) // makes sure not an absorbed ion

      const AtomicPionQuark = this.PionQuark

      const [pion, setPion] = createAtomicPion(new AtomicPionQuark(target, valueKey, this, hooks), hooks?.as, !pionAccess)

      const state = {
         get: pion,
         set: (value: unknown) => { setPion(value); return true; }
      };

      proto.set(valueKey, state)

      const $state = pionAccess ? {
         get: () => pion,
         set: nowrite
      } : undefined

      if (pionAccess) proto.set(ionKey, $state!)

      return key === ionKey ? $state : state
   }

   protected initStaticProperty(
      key: ProxyKey,
      value: unknown,
   ) {
      const property = {
         get: () => value,
         set: nowrite
      }
      this.proto.set(key, property)
      return property
   }


   protected initDerivedProperty(
      key: ProxyKey,
      valueKey: ProxyKey,
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

      const { as: transform, '@get': castGet, '@set': castSet } = (this.getPropertyHooks(valueKey) ?? {}) as PropertyHooks

      const getWithHook = castGet ? withGetHook(get, castGet) : get;
      const setWithHook = castSet ? withSetHook<boolean>(set, castSet, () => this.state.get()[valueKey]) : set;

      const [getter, setter] = transform ? withTransform(transform, getWithHook, setWithHook) : [getWithHook, setWithHook]

      const state = {
         get: getter,
         set: setter
      }
      proto.set(valueKey, state)

      const $state = ionKey ? {
         get: PionAccess(getter, setter),
         set: nowrite
      } : undefined

      if (ionKey) proto.set(ionKey, $state!)

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
      key: ProxyKey,
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
         } satisfies TriggerableThis & TrackableThis & CustomThis)

         const methodAccess = {
            get: () => method,
            set: nowrite
         }
         this.proto.set(key, methodAccess)
         return methodAccess
      }
      else {
         const methodAccess = {
            get: GetBoundMethod(fn, this.proxy),
            set: nowrite
         }
         this.proto.set(key, methodAccess)
         return methodAccess
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

      const state = {
         get: hooks?.['@get'] ? withGetHook(ion, hooks['@get']) : get,
         set: hooks?.["@set"] ? withSetHook<boolean>(set, hooks['@set'], ion) : set
      }

      proto.set(valueKey, state)

      const $state = {
         get: !hasQuark(ion) ? GetBoundMethod(ion, proxy) : () => target[ionKey],
         set: nowrite
      }

      proto.set(ionKey, $state)

      return key === ionKey ? $state : state;
   }

   // #endregion

   state: CollectiveState

   private track = (op: ProxyKey, key: unknown) => {
      trackOp(this, op, key)
   }

   private trackModel = () => {
      track(this)
   }

   private trigger = (op: ProxyKey, key: unknown) => {
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

   private triggerAll = (op: ProxyKey) => {
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


function GetBoundMethod(method: Function, obj: AnyObject) {
   const boundMethod = method.bind(obj)
   return () => boundMethod
}

function assertNotFunction(value: unknown) {
   if (isFunction(value)) throw new Error('TypeError: value cannot be a function')
}

export function isIonKey(key: PropertyKey): key is string {
   return typeof key === 'string' && /^\$[a-z]/.test(key)
}

export function isIonicProxy(value: any): value is QuarkyIonicProxy {
   if (!isObject(value)) return false;
   return hasQuark(value) && quarkOf(value) instanceof ModelQuark;
}

type ToRaw<T> = T // FIX: STAND-IN

export function toRaw<T>(obj: T): ToRaw<T> {
   if (obj instanceof ModelQuark) {
      return obj.target as ToRaw<T>;
   }
   if (isIonicProxy(obj)) {
      return quarkOf(obj).target as ToRaw<T>;
   }
   return obj as ToRaw<T>; // already raw target
}

export function trackOp(
   quark: ModelQuark,
   op: ProxyKey,
   key: unknown
) {
   track(quark.ops.asTracked(op, key))
}

export function triggerOp(
   quark: ModelQuark,
   op: ProxyKey,
   key: unknown,
   update: Update
) {
   trigger(quark.ops.getTracked(op, key), update)
}