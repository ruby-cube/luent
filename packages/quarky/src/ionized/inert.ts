import { AnyObject } from "@rue/types";
import { isMuon } from "../ion/Ion";
import { isIonizedModel } from "./ionize";
import { isFunction } from "@rue/utils";

const inertObjects: WeakSet<AnyObject> = new WeakSet()

export type Inert = { [INERT]: true }

const INERT = Symbol('inert');

export function inert<T extends AnyObject>(obj: T): T & Inert {
   if (!(obj instanceof Object)) throw new Error("Only objects can be marked as inert")
   if (isMuon(obj) || isIonizedModel(obj)) throw new Error('cannot mark an ion or ionized model as inert')
   if (isFunction(obj)) throw new Error(`Functions are inert by default`)
   inertObjects.add(obj)
   return obj as T & Inert
}

export function isInert<T extends AnyObject>(value: T): value is T & Inert {
   return inertObjects.has(value)
}


type InertMap<T extends AnyObject> = {
   [K in keyof Partial<T>]: T[K] extends AnyObject ? InertMap<T[K]> | boolean : boolean
}

type WithInertProps<T extends AnyObject, M extends InertMap<T>> = {
   [K in keyof T]: K extends keyof M ? M[K] extends true ? T[K] & Inert : M[K] extends InertMap<T[K]> ? WithInertProps<T[K], M[K]> : T[K] : T[K]
}

export function markInertProps<T extends AnyObject, M extends InertMap<T>>(obj: T, inertProps: M): WithInertProps<T, M> {
   for (const key in inertProps) {
      if (inertProps[key] === true) {
         try {
            inert(obj[key])
         }
         catch (err) {
            if (__DEV__) console.warn('Invalid Input: Only non-ion, non-ionized, non-function objects can be marked inert.')
         }
      }
      else {
         markInertProps(obj[key], inertProps[key] as InertMap<typeof obj[typeof key]>)
      }
   }
   return obj as WithInertProps<T, M>
}
