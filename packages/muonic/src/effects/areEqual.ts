import { isEqual } from "@rue/utils";
import { ReactiveModel, toRaw } from "../ionic/ReactiveModel";
import { isReactiveObject } from "../ionic/ReactiveObject";

export function areEqual(newValue: any, oldValue: any) { //TODO: this is really tricky.. do I do a shallow diff or a deep diff for arrays?? I think it should be shallow diff because if you are watching an array, you typically care about the order
    const _newValue = toRaw(newValue)
    const _oldValue = toRaw(oldValue)
    if (newValue instanceof Array) return areShallowEqualArrays(_newValue, _oldValue);
    if (newValue instanceof Set) return areEqualSets(_newValue, _oldValue); // inherently shallow
    if (newValue instanceof Map) return areEqualMaps(_newValue, _oldValue); // deep
    // if (isReactiveObject(newValue)) return reactivePropsAreEqual(_newValue, _oldValue); // partial deep
    if (newValue instanceof Object) return isEqual(_newValue, _oldValue); // deep
    if (oldValue === newValue) return true;
    return false;
}

function isShallowEqual(collectionA: any[] | Set<any>, collectionB: any[] | Set<any>) {
    const original = toRaw(collectionA)
    if (original instanceof Array) return areShallowEqualArrays(<any[]>collectionA, <any[]>collectionB);
    if (original instanceof Set) return areEqualSets(<Set<any>>collectionA, <Set<any>>collectionB);
    if (__DEV__) console.warn("Not yet implemented for Objects and Map")
}

function areEqualArrays(arrayA: any[], arrayB: any[]) {
    if (arrayA.length !== arrayB.length) return false;
    for (let i = 0; i < arrayA.length; i++) {
        if (!areEqual(arrayA[i], arrayB[i])) return false;
    }
    return true;
}

export function areShallowEqualArrays(arrayA: any[], arrayB: any[]) {
    if (arrayA.length !== arrayB.length) return false;
    for (let i = 0; i < arrayA.length; i++) {
        if (arrayA[i] !== arrayB[i]) return false;
    }
    return true;
}


function reactivePropsAreEqual(reactiveA: ReactiveModel, reactiveB: ReactiveModel) {
    if (!isReactiveObject(reactiveA) || !isReactiveObject(reactiveB)) throw new Error("Invalid input type");
    const rawA = toRaw(reactiveA)
    const rawB = toRaw(reactiveB)
    for (const key in rawA) {
        const valueA = rawA[key];
        const valueB = rawB[key];
        if (!areEqual(valueA, valueB)) return false;
    }
    return true;
}

function areEqualSets(setA: Set<any>, setB: Set<any>) {
    if (setA.size !== setB.size) return false;
    for (const item of setA) {
        if (!setB.has(item)) return false;
    }
    return true;
}

function areEqualMaps(mapA: Map<any, any>, mapB: Map<any, any>) {
    if (mapA.size !== mapB.size) return false;
    for (const [key, value] of mapA) {
        if (!mapB.has(key)) return false;
        if (!areEqual(value, mapB.get(key)))
            return false;
    }
    return true;
}