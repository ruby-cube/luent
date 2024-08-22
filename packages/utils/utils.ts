import { AnyObject, Class } from "@rue/types";
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