import { AnyObject } from "@rue/types";
import { TraceableSubject } from "../debug/debug";
import { QUARK, Quark, QuarkOf } from "../Quark";


export type Capsule = TraceableSubject & {
   [QUARK]: Quark
}

export type MutableCapsule = Capsule & {
   [QUARK]: {
      asReined?: object
      asReadonly?: object
   }
}




export function attachCapsuleMethods(type: string, capsule: Capsule & AnyObject, methods: AnyObject) {
   for (const key in methods) {
      capsule[key]
         = 
         // __DEV__ ? traceableMethodWrap(type, capsule, key, methods[key]) : 
         methods[key]
   }
   return capsule;
}