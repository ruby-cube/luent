import { isEqual } from "@rue/utils";
import { isReactiveObject, toRaw } from "../reactivemodel/Reactive$";

export function areEqual(newValue: any, oldValue: any) { //TODO: this is really tricky.. do I do a shallow diff or a deep diff for arrays?? I think it should be shallow diff because if you are watching an array, you typically care about the order
    const original = toRaw(newValue);
    if (original instanceof Array) return areShallowEqualArrays(oldValue, newValue);
    if (original instanceof Set) return areEqualSets(oldValue, newValue); // inherently shallow
    if (original instanceof Map) return areEqualMaps(newValue, oldValue); // deep
    if (isReactiveObject(newValue)) return reactivePropsAreEqual(oldValue, newValue); // partial deep
    if (original instanceof Object) return isEqual(oldValue, newValue); // deep
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
    for (const key in reactiveA) {
        const valueA = reactiveA[key];
        const valueB = reactiveB[key];
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