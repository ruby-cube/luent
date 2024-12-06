import { AnyObject } from "@rue/types";

const inertObjects: WeakSet<AnyObject> = new WeakSet()

export type Inert = { [INERT]: true }
const INERT = Symbol('inert');
export function inert<T extends AnyObject>(obj: T): T & Inert {
   if (obj instanceof Function) throw new Error(`Functions are inert by default`)
   if (!(obj instanceof Object)) throw new Error("Only objects can be marked as inert")
   inertObjects.add(obj)
   return obj as T & Inert
}

export function isInert(value: any): value is AnyObject {
   return inertObjects.has(value)
}