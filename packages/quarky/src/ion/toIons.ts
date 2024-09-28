import { AnyObject } from "@rue/types";
import { toRaw } from "../ionize/IonicModel";
import { AnyIon, isAnyIon } from "./AnyIon";

type NormalizeAllKeysToIons<T extends AnyObject> = {
    [K in keyof T]: T[K] extends AnyIon ? T[K] : () => T[K]
}

type NormalizeKeysToIons<T extends AnyObject, K extends keyof T> = {
    [S in K]: T[S] extends AnyIon ? T[S] : () => T[K]
} & Omit<T, K>

//TODO: if keys are provided, return NormalizeKeysToIons. if no keys, NormalizeAllKeysToIons

// normalizes raw values into getters

function toIons<T extends AnyObject, K extends keyof T, O>(obj: T, keys?: O & K[]) {
    const output = {} as AnyObject
    const rawObj = toRaw(obj);
    if (keys) {
        for (const key of keys) {
            output[key] = normalizeToIon(obj, key);
        }
    }
    else {
        for (const key in rawObj) {
            output[key] = normalizeToIon(obj, key);
        }
    }
    return output;
}

function normalizeToIon(obj: AnyObject, key: PropertyKey) {
    const value = toRaw(obj)[key]
    return isAnyIon(value) ? value : () => value
}