import { AnyObject, Mutable, MutableObject } from "@luently/types";

export type KeyPath = string[];
export type KeyPathString = string;

export function toKeyPathString(keyPath: KeyPath) {
    let keyPathString = "";
    const limit = keyPath.length;
    for (let i = 0; i < limit; i++) {
        const key = keyPath[i];
        if (i === 0) keyPathString = key;
        else keyPathString = keyPathString + "." + key;
    }
    return keyPathString;
}

export function toKeyPath(keyPathString: string) {
    return keyPathString.split(".");
}

export function toKeyPathArray(array: KeyPathString[]) {
    const keyPathArray = [] as KeyPath[];
    for (const keyPathString of array) {
        keyPathArray.push(toKeyPath(keyPathString))
    }
    return keyPathArray;
}

export function getKeyPathValue(object: AnyObject, keyPath: string[]): any {
    let level = object;
    for (const key of keyPath) {
        if ( __DEV__ && !(key in level)) console.error(`getKeypathValue: key (${key}) in keypath (${keyPath}) does not exist on object`) //DEV
        level = level[key];
    }
    return level;
}

export function setKeyPath(object: Mutable<AnyObject>, keyPath: string[], value: any) {
    let level = object;
    const _keyPath = [...keyPath];
    const key = _keyPath.pop();
    if (key == null) throw new Error("[keypath] `keyPath` is empty");
    for (const key of _keyPath) {
        if ( __DEV__ && !(key in level)) console.error(`getKeypathValue: key (${key}) in keypath (${keyPath}) does not exist on object`) //DEV
        level = level[key];
    }
    if ( __DEV__ && !(key in level)) console.error(`getKeypathValue: key (${key}) in keypath (${keyPath}) does not exist on object`) //DEV
    level[key] = value;
}