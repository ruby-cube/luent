import { AnyObject } from "@rue/types";
import { __DEV__asTraceable, emitSignal } from "../debug/debug";
import { createIonicModel } from "./IonicModel";
import { __DEV__trace } from "../debug/debug";
import { QUARK, quarkOf } from "../abstract/Quark";
import { isIonicProxy, QuarkyIonicProxy } from "./ModelQuark";


export type IonicProxy = AnyObject & { '~ionic-proxy': true }

export const INTERNAL_OP = "[[INTERNAL]]"

export const EACH = Symbol('each')

const ionicModels: WeakMap<AnyObject, QuarkyIonicProxy> = new WeakMap()

export function asIonic<T extends AnyObject>(target: T, config?: AnyObject): IonicProxy & T {
   if (isIonicProxy(target)) return target as any as IonicProxy & T;
   const existing = ionicModels.get(target)
   if (existing) {
      if (__DEV__ && quarkOf(existing).extension !== config) {
         console.warn(`[DEV RESEARCH] Ionic model config mismatch. Config of existing model is not identical to config provided by asIonic`)
      }
      return existing as any as IonicProxy & T
   }
   return Ionic(target, config)
}

export function Ionic<T extends AnyObject>(target: T, config?: AnyObject): IonicProxy & T {
   const proxy = createIonicModel(target, config ?? {})
   ionicModels.set(target, proxy)
   return proxy as any as IonicProxy & T
}




