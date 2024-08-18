import { SSRComponent } from "./lumin.js";

const promiseMap: WeakMap<Promise<SSRComponent>, SSRComponent> = new WeakMap()

export function isResolved(promise: Promise<SSRComponent>) {
    return promiseMap.has(promise)
}

export function storeResolvedValue(promise: Promise<SSRComponent>, value: SSRComponent) {
    promiseMap.set(promise, value);
}

export function getResolvedValue(promise: Promise<SSRComponent>) {
    const component = promiseMap.get(promise)
    if (!component) throw new Error("No component :(  This should never happen")
    return component;
}