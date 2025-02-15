import { AnyObject } from "@rue/types";
import { Traceable, traceableMethodWrap, TraceableSubject } from "../debug/debug";
import { DEVLabellable } from "../debug/DEVLabellable";
import { QUARK, Quark, QuarkOf } from "../Quark";


export type Capsule = DEVLabellable & TraceableSubject & {
   [QUARK]: Quark
}

export type MutableCapsule = Capsule & {
   [QUARK]: {
      asReined?: object
      asReadonly?: object
   }
}


export function __DEV__initTraceability(capsule: QuarkOf<Capsule>) {
   capsule.__DEV__asTraceable = new Traceable()
}

export function attachCapsuleMethods(type: string, capsule: Capsule & AnyObject, methods: AnyObject) {
   for (const key in methods) {
      capsule[key]
         = __DEV__ ? traceableMethodWrap(type, capsule, key, methods[key]) : methods[key]
   }
   return capsule;
}