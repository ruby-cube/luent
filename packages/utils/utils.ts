import { AnyObject, Class } from "@rue/types";
// import _ from "lodash"

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

export function isEqual(value1: any, value2: any) {
    // Check for primitive types and special cases
    if (value1 === value2) {
        return true; // Handles: null, undefined, booleans, numbers, strings, symbols, and functions
    }

    // Check if both values are objects
    if (typeof value1 !== 'object' || typeof value2 !== 'object' || value1 === null || value2 === null) {
        return false; // Handles: one is null and the other is not, or one is not an object
    }

    // Handle arrays
    if (Array.isArray(value1) && Array.isArray(value2)) {
        if (value1.length !== value2.length) return false;
        for (let i = 0; i < value1.length; i++) {
            if (!isEqual(value1[i], value2[i])) return false;
        }
        return true;
    }

    // Handle Sets
    if (value1 instanceof Set && value2 instanceof Set) {
        if (value1.size !== value2.size) return false;
        for (const item of value1) {
            if (!value2.has(item)) return false;
        }
        return true;
    }

    // Handle Maps
    if (value1 instanceof Map && value2 instanceof Map) {
        if (value1.size !== value2.size) return false;
        for (const [key, value] of value1) {
            if (!isEqual(value, value2.get(key))) return false;
        }
        return true;
    }

    // Handle plain objects
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);

    if (keys1.length !== keys2.length) return false;
    for (const key of keys1) {
        if (!keys2.includes(key) || !isEqual(value1[key], value2[key])) return false;
    }

    return true;
}


export function normalizeToArray(value: any | any[]) {
    if (value === undefined) return [];
    return value instanceof Array ? value : [value];
}

export const UNDEFINED = Symbol('undefined');


export function moveMultipleUniqueItems(uniqueItemsToRemove: Set<any>, list: any[], reinsertionIndex: number){ // assumes items are unique
    const indicesAndRemoveCount: [number, number][] = [];
    const removedItems = [];
    let j = 0;
    while (j < list.length) {
        const id = list[j];
        if (uniqueItemsToRemove.has(id)) {
            const prevEntry = indicesAndRemoveCount.at(-1);
            if (prevEntry && prevEntry[0] + 1 === j) {
                prevEntry[1]++; // increment count
            }
            else {
                indicesAndRemoveCount.push([j, 1])
            }
            removedItems.push(id);
            if (reinsertionIndex > j) reinsertionIndex--; // adjust index
        }
        j++;
    }
    let k = indicesAndRemoveCount.length; // loop through backwards to avoid having to recalculate index
    while (k--) {
        const [index, count] = indicesAndRemoveCount[k];
        list.splice(index, count);
    }
    list.splice(reinsertionIndex, 0, ...removedItems)
}


export function useIncrementalID(){
    let count = 0;
    return function getIncrementalID(){
        return count++;
    }
}