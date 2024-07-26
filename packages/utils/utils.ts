import { Class } from "@rue/types";
import _ from "lodash"

export function areEqualSets(setA: Set<unknown>, setB: Set<unknown>) {
    if (setA.size !== setB.size) return false;
    for (const item of setA) {
        if (!setB.has(item)) return false;
    }
    return true;
}

export const noop = () => { };

export function isClass(obj: any): obj is Class {
    return 'prototype' in obj;
}


export const $type = 0 as unknown;

export const isEqual = _.isEqual


export function normalizeToArray(value: any | any[]) {
    return value instanceof Array ? value : [value]
}