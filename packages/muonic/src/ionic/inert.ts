import { AnyObject } from "@rue/types";

const inertObjects: WeakSet<AnyObject> = new WeakSet()

export function inert<T extends AnyObject>(obj: T): T {
    if (obj instanceof Function) throw new Error(`Functions are inert by default`)
    if (!(obj instanceof Object)) throw new Error("Only objects can be marked as inert")
    inertObjects.add(obj)
    return obj;
}

export function isInert(value: any): value is AnyObject {
    return inertObjects.has(value)
}