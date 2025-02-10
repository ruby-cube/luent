import { AnyObject } from "@rue/types";
import { Traceable, traceableMethodWrap } from "../debug/debug";
import { DEVLabellable } from "../debug/DEVLabellable";
import { StatefulQuarks } from "../actions/Action";
import { Quarks } from "../Quarks";


export type Capsule = DEVLabellable

export type CapsuleQuarks = {
   asReined?: object
   asReadonly?: object
   __DEV__asTraceable?: Traceable;
} & StatefulQuarks & Quarks

export function __DEV__initTraceability(capsule: CapsuleQuarks) {
   capsule.__DEV__asTraceable = new Traceable()
}

export function attachCapsuleMethods(type: string, capsule: Capsule & AnyObject, methods: AnyObject) {
   for (const key in methods) {
      capsule[key]
         = __DEV__ ? traceableMethodWrap(type, capsule, key, methods[key]) : methods[key]
   }
   return capsule;
}