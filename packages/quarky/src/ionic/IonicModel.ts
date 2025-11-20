import type { AnyObject } from "@rue/types"
import { __DEV__getTrace } from "../../../flask/debug"
import { EACH } from "./Ionic"
import { trigger } from "../reactivity/Atom"
import { QUARK } from "../abstract/Quark"
import { PropertyHooks } from "./Pion"
import { debug, isFunction } from "@rue/utils"
import { track } from "../reactivity/Compound"
import { $activeUpdate, Update } from "../reactivity/Update"
import { ModelQuark, ProxyKey, QuarkyIonicProxy, trackOp, triggerOp } from "./ModelQuark"




type MethodHook = (event: { input: unknown[], output: unknown }) => unknown;

export type IonicModelHooks = { [EACH]?: PropertyHooks } & { [key: ProxyKey]: PropertyHooks | MethodHook }

type Overrides = { [key: ProxyKey]: unknown }

type Extender = (proxy: AnyObject) => IonicModelHooks & Overrides

export function createIonicModel(
   target: AnyObject,
   config: IonicModelHooks | Extender
) {
   const modelQuark = new ModelQuark(target)

   const proxy = new Proxy(modelQuark, traps) as any as QuarkyIonicProxy

   const extension = isFunction(config) ? config(proxy) : undefined
   modelQuark.config = config
   modelQuark.hooks = extension ?? config as IonicModelHooks
   modelQuark.extension = extension
   modelQuark.proxy = proxy;
   return proxy
}



const INTERNAL_OP = "[[INTERNAL]]"

const traps: ProxyHandler<ModelQuark> = {

   get(modelQuark, key, receiver) {
      __DEV__assertNotPrototype(modelQuark.proxy, receiver)
      const proto = modelQuark.proto
      if (!proto.has(key)) {
         return modelQuark.initProperty(key)?.get()
      }
      return proto.get(key)!.get()
   },

   set(modelQuark, key, newValue, receiver) {
      __DEV__assertNotPrototype(modelQuark.proxy, receiver)
      const proto = modelQuark.proto
      if (!proto.has(key) && !(key in modelQuark.state.get())) {
         return modelQuark.setNewProperty(key, newValue) // FIX: what if property was set in a preceding update that hasn't committed?
      }
      if (!proto.has(key))
         return Boolean(modelQuark.initProperty(key)?.set(newValue))
      return proto.get(key)!.set(newValue)
   },


   has(modelQuark, key) {
      if (key === QUARK) return true;
      if (!modelQuark.proto.has(key)) modelQuark.initProperty(key)
      trackOp(modelQuark, '[[in]]', key)
      return modelQuark.proto.has(key)
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
      if (proto.has(key)) {
         // set/trigger pion
         proto.get(key)!.set(undefined)

         // update proto
         update.atCommit(() => {
            proto.delete(key)
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

export function __DEV__assertNotPrototype(proxy: QuarkyIonicProxy, receiver: AnyObject) {
   if (proxy !== receiver) throw new Error('An ionic model may not serve as a prototype. Construct inheritance tree from raw classes')
}

