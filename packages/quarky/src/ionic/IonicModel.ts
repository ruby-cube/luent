import type { AnyObject } from "@rue/types"
import { __DEV__getTrace } from "../../../flask/debug"
import { EACH } from "./Ionic"
import { trigger } from "../reactivity/Atom"
import { QUARK } from "../abstract/Quark"
import { PropertyHooks } from "./Pion"
import { debug } from "@rue/utils"
import { $activeUpdate } from "../reactivity/Update"
import { ModelQuark, ProxyKey, QuarkyIonicProxy, trackOp, triggerOp } from "./ModelQuark"


export type MethodHook = { '@call': (event: { input: unknown[], output: unknown }) => unknown; }

export type IonicModelHooks<T = AnyObject> = {
   [EACH]?: PropertyHooks
} & {
   [K in keyof Partial<T>]?: PropertyHooks | /* TODO: */MethodHook | NestedAsyncAction
} & {
   [key: `${string}`]: NestedAsyncIon // TODO:
} & {
   [key: ProxyKey]: Function // TODO:
}

type NestedAsyncIon = (() => any) & { pending: boolean } // FIX: standin
type NestedAsyncAction = Function & { pending: boolean } // FIX: standin

type Overrides = { [key: ProxyKey]: unknown }

type Extender = (proxy: AnyObject) => IonicModelHooks & Overrides

export function createIonicModel(
   target: AnyObject,
   config: IonicModelHooks | undefined,
   // extender: Function | undefined
) {
   const modelQuark = new ModelQuark(target, config)

   const proxy = new Proxy(target, useTraps(modelQuark)) as any as QuarkyIonicProxy

   // const extension = extender ? extender(proxy) : undefined
   // modelQuark.extension = extension
   modelQuark.proxy = proxy;
   return proxy
}



const INTERNAL_OP = "[[INTERNAL]]"

function useTraps(modelQuark: ModelQuark): ProxyHandler<ModelQuark> {
   return {
      get(_, key, receiver) {
         __DEV__assertNotPrototype(modelQuark.proxy, receiver)
         const proto = modelQuark.proto
         if (!proto.has(key)) {
            return modelQuark.initProperty(key)?.get()
         }
         return proto.get(key)?.get()
      },

      set(_, key, newValue, receiver) {
         __DEV__assertNotPrototype(modelQuark.proxy, receiver)
         const proto = modelQuark.proto
         if (!proto.has(key) && !(key in modelQuark.state.get())) {
            // FIX:
            // - For items breaks without !proto.has(key)
            // - setting new array index breaks with it..
            return Boolean(modelQuark.setNewProperty(key, newValue)?.set(newValue)) 
            // FIX: what if property was set in a preceding update that hasn't committed?
         }
         const success = !proto.has(key)
            ? Boolean(modelQuark.initProperty(key)?.set(newValue))
            : proto.get(key)!.set(newValue)
         if (success) $activeUpdate()!.atCommit(() => modelQuark.target[key] = modelQuark.state.pending[key] = newValue)
         return success
      },


      has(_, key) {
         if (key === QUARK) return true;
         if (!modelQuark.proto.has(key)) modelQuark.initProperty(key)
         trackOp(modelQuark, '[[in]]', key)
         return modelQuark.proto.has(key)
      },

      getOwnPropertyDescriptor(_, key) {
         modelQuark.proxy[key] // tracks property
         return Object.getOwnPropertyDescriptor(modelQuark.state.get(), key)
      },

      defineProperty(_, key, descriptor) {
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

         modelQuark.proto.get(key)?.set(descriptor.value)
         return true;
      },

      deleteProperty(_, key) {
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

      ownKeys(_) {
         trackOp(modelQuark, INTERNAL_OP, 'ownKeys')
         return Reflect.ownKeys(modelQuark.state.get())
      },

      getPrototypeOf(_) {
         return Reflect.getPrototypeOf(modelQuark.target)
      },

      setPrototypeOf() {
         debug.warn("[DISALLOWED] Cannot setPrototypeOf ionized model")
         return false
      },

      isExtensible(_) {
         modelQuark.initIsExtensible()
         return modelQuark.$isExtensible!()
      },

      preventExtensions(_) {
         modelQuark.initIsExtensible()
         return modelQuark.setIsExtensible!(false)
      },
   }
}
export function __DEV__assertNotPrototype(proxy: QuarkyIonicProxy, receiver: AnyObject) {
   if (proxy !== receiver) throw new Error('An ionic model may not serve as a prototype. Construct inheritance tree from raw classes')
}

