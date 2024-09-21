
/* PURE OPS */

import { AnyObject } from "@rue/types";

export function getSpreadableMethods(object: Object) {
    const proto = Object.getPrototypeOf(object);
    const methodKeys = Object.getOwnPropertyNames(proto);
    const methods = {} as AnyObject;
    for (const key of methodKeys) {
        if (key === "constructor") continue;
        methods[key] = proto[key];
    }
    return methods;
}

export function clone<T extends { [key: string | number | symbol]: any }>(obj: T, levels?: number, _nestedCall?: boolean) {
    if (!_nestedCall && levels === 0) throw new Error("[clone] `levels` argument must be greater than 0");
    if (levels) {
        if (!_nestedCall) levels--;
        const _clone = obj instanceof Array ? [] : {} as { [key: string | number | symbol]: any }
        for (const key in obj) {
            const val = obj[key] as any;
            _clone[key] = levels && val instanceof Object ? clone(val, levels - 1, true) : val;
        }
        return _clone;
    }
    if (obj instanceof Array) {
        return [...obj];
    }
    return {
        ...obj
    };
}

export function deepClone<T extends Object>(obj: T) {
    return structuredClone(obj)
}

export function cloneWithAdditionalProps<T extends Object, P extends Object>(target: T, props: P) {
    if (__DEV__) {
        for (const key in props) {
            if (target.hasOwnProperty(key)) console.error(`Name collision: "${key}"`);
        }
    }
    return {
        ...target,
        ...props
    } as T & P;
}


export function iterate<T extends Object, K extends (keyof T)[], P extends Object>(target: T, preservedKeys: K, newProps: P) {
    const oldProps = {} as Pick<T, K[number]>;
    for (const key of preservedKeys) {
        oldProps[key] = target[key];
    }
    return {
        ...oldProps,
        ...newProps
    }
}

export function cloneWithMods<T extends Object, P extends Object, K extends (keyof T)[]>(target: T, mods: { add: P, omit: K }) {
    const newProps = mods.add;
    const omittedKeys = new Set(mods.omit);
    const oldProps = {} as T;
    for (const key in target) {
        if (omittedKeys.has(key)) continue;
        oldProps[key] = target[key];
    }
    return {
        ...oldProps,
        ...newProps
    } as P & Omit<T, K[number]>;
}




/* EFFECTIVE OPS */

//NOTE: `addProps` contrasts with `assign` in that it prevents name collisions with existing props by throwing an error
export function addProps(target: { [key: string | number | symbol]: any }, source: { [key: string | number | symbol]: any }) {
    for (const key in source) {
        if (target[key] === undefined) throw new Error(`Name collision. A '${key}' prop already exists on this object. Please rename prop`);
        target[key] = source[key];
    }
    return target;
}

function swapKeysAndValues(source: { [key: string]: string }) {
    const target = {} as AnyObject;
    for (const key in source) {
        target[source[key]] = key;
    }
    return target;
}


export function isObjectLiteral(obj: AnyObject) {
    return obj.constructor === Object;
}

export function isObject<T>(value: T): value is T extends AnyObject ? T : never {
    return value instanceof Object;
}

export function isFunctionWithProps<T>(value: T): value is T extends Function ? T & AnyObject : never {
    return value instanceof Function;
}

export type ProxyTargetKey = string | symbol