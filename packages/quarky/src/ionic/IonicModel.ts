import type { AnyObject } from "@rue/types"
import { __DEV__getTrace } from "../../../flask/debug"
import { IonicProxy } from "./Ionic"
import { Atom, TrackedAtom, trigger } from "../reactivity/Atom"
import { Traceable } from "../debug/Traceable"
import { QUARK } from "../abstract/Quark"
import { createInternalPion, initializeProperty, InternalPionQuark } from "./Pion"
import { trackOp } from "./IonicMethods"
import { debug } from "@rue/utils"
import { asTrackedOp, getTrackedOp, TrackedOps } from "./TrackableOp"
import { track } from "../reactivity/Compound"

export type Proto = {
   getters: AnyObject,
   setters: AnyObject
}

const IONIC_PROXY = Symbol('ionicProxy')
const IONIZED_MODEL = 'ionized model' as const

function unwritable(value: unknown) {
   return false;
} // TODO: use in initProperty

export class ModelQuark implements Atom {
   __DEV__asTraceable: Traceable = new Traceable()
   quarkType = IONIZED_MODEL
   asTrackedAtom: TrackedAtom | undefined
   proto: Proto
   proxy!: IonicProxy
   internal: Proto

   constructor(
      public target: AnyObject, //initialData
      public config: AnyObject
   ) {
      this.proto = {
         getters: Object.create(target, {
            [QUARK]: { value: () => this },
            constructor: { value: () => target.constructor }
            // TODO: 
            // hasOwnProperty
            // isPrototypeOf
            // propertyIsEnumerable
            // toLocaleString
            // toString
            // valueOf
            // __defineGetter__
            // __defineSetter__
            // __lookupGetter__
            // __lookupSetter__
            // __proto__
         }),
         setters: Object.create(target, {
            [QUARK]: { value: unwritable },
            constructor: { value: unwritable }
         })
      }

      this.internal = {
         getters: {
         },
         setters: {
         }
      }
   }

   initIsExtensiblePion(){
      const target = this.target;
      [this.$isExtensible, this.setIsExtensible] = createInternalPion(new InternalPionQuark(Object.isExtensible(target), this, (value) => {
         if (value === true) throw new Error('invalid set')
         Reflect.preventExtensions(target)
      }))
   }

   getInternalPion(key: string) {
      const get = this.internal.getters;
      if (!(key in get)) this.initInternalPion(key)
   }

   setInternalPion(key: string, value: unknown) {

   }

   initInternalPion(key: string, value: unknown, onCommit: (value: unknown) => void) {
      const [$state, setState] = createInternalPion(new InternalPionQuark(value, this, onCommit))
   }

   trackedOps: Record<PropertyKey, TrackedOps> = {
      '[[in]]': new Map()
   }

   registerOp(key: PropertyKey, entryKey: any, atomicOp: AtomicQuark) {
      const ops = this.trackedOps[key] ?? new Map();
      if (!(ops instanceof Map)) {
         debug.error(`${String(key)} is not an op`)
         return atomicOp;
      }
      this.trackedOps[key] = ops;
      ops.set(entryKey, atomicOp)
      return atomicOp;
   }
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
      const get = modelQuark.proto.getters
      if (!(key in get)) initProperty(modelQuark, key)
      return get[key]?.()
   },

   set(modelQuark, key, newValue, receiver) {
      __DEV__assertNotPrototype(modelQuark.proxy, receiver)
      const set = modelQuark.proto.setters
      if (!(key in set) && !initProperty(modelQuark, key)) {
         return initNewProperty(modelQuark, key, newValue)
      }
      return set[key](newValue)
   },

   has(modelQuark, key) {
      if (key === QUARK) return true;
      const get = modelQuark.proto.getters
      if (!(key in get)) initProperty(modelQuark, key)
      track(asTrackedOp(modelQuark, '[[in]]', key))
      return key in get
   },

   getOwnPropertyDescriptor(target, key) {
      // TODO: track
      return Object.getOwnPropertyDescriptor(target, key) // TODO: adjust key for absorbed ion
   },

   defineProperty(target: AnyObject, key, attributes) {
      const success = Reflect.defineProperty(state.get(), key, attributes)
      if (!success) return false;
      const update = initModelUpdate(modelQuark)
      if (!(key in target)) {
         triggerKeysChange(modelQuark, key, update)
      }
      else if (target[key] !== attributes.value) {
         getPionQuark(target, key)?.trigger(update)
      }
      trigger(modelQuark, update)
      // TODO: record mutation?
      return true;
   },

   deleteProperty(target: AnyObject, key) {
      const pionQuark = getPionQuark(proxyProto, key)
      const success = Reflect.deleteProperty(state.get(), key)
      if (!success) return false;

      const update = initModelUpdate(modelQuark)

      pionQuark?.trigger(update)
      if (key in proxyProto) {
         triggerKeysChange(modelQuark, key, update)
      }
      trigger(modelQuark, update)

      modelQuark.$ownKeys.set()

      trigger(quarkOf(modelQuark.$ownKeys))
      // TODO: record mutation?
      return true;
   },

   ownKeys() {
      trackOp(ionizedModel, INTERNAL_OP, ['ownKeys']) // TODO: trigger when any new property is added or deleted
      return Reflect.ownKeys(state.get())
   },

   getPrototypeOf(target) {
      return Reflect.getPrototypeOf(target)
   },

   setPrototypeOf(target, proto) {
      debug.warn("[DISALLOWED] Cannot setPrototypeOf ionized model")
      return false
   },

   isExtensible(modelQuark) {
      return modelQuark.$isExtensible()
   },

   preventExtensions(modelQuark) {
      return modelQuark.$isExtensible.set(false)
   },
}

function initProperty(
   modelQuark: ModelQuark,
   key: PropertyKey
) {
   const target = modelQuark.target;
   if (!(key in target)) return false;
   _initProperty(modelQuark, key)
   return true;
}


function _initProperty(
   modelQuark: ModelQuark,
   key: PropertyKey
) {
   let obj = modelQuark.target;
   do {
      const descriptor = Object.getOwnPropertyDescriptor(obj, key)
      if (descriptor) {
         initializeProperty(modelQuark, key, descriptor)
         break;
      }
      obj = Object.getPrototypeOf(obj)
   } while (obj.constructor !== Object)
}


function initNewProperty(
   modelQuark: ModelQuark,
   key: PropertyKey,
   value: unknown
) {
   const target = modelQuark.target
   if (!Object.isExtensible(target)) return false;
   target[key] = value;
   _initProperty(modelQuark, key)
   modelQuark.proto.setters[key](value)
   return true;
}


export function __DEV__assertNotPrototype(proxy: IonicProxy, receiver: AnyObject) {
   if (proxy !== receiver) throw new Error('An ionic model may not serve as a prototype. Construct inheritance tree from raw classes')
}