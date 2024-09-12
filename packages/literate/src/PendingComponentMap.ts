import { provideAppState, TypedKey, constAppState } from "@rue/lumo";
import { SSRComponent } from "./SSRComponent";


const PROMISE_MAP = Symbol('promiseMap') as TypedKey<WeakMap<Promise<SSRComponent>, SSRComponent>>

const getPromiseMap = constAppState(PROMISE_MAP, () => new WeakMap())

export function isResolved(promise: Promise<SSRComponent>) {
    return getPromiseMap().has(promise)
}

export function storeResolvedComponent(promise: Promise<SSRComponent>, value: SSRComponent) {
    getPromiseMap().set(promise, value);
}

export function getResolvedComponent(promise: Promise<SSRComponent>) {
    const component = getPromiseMap().get(promise)
    if (!component) throw new Error("No component :(  This should never happen")
    return component;
}