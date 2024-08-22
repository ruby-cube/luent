import { AnyObject } from "@rue/types";
import { isExtendedArray } from "./array";
import { isExtendedObject } from "./object";

function encapsulate(target: AnyObject) {
    if (!(target instanceof Object)) {
        if (__DEV__) console.warn('Invalid input')
        return target;
    }
    if (target instanceof Array) {
        return encapsulateArray(target);
    }
    return encapsulateObject(target)
}


function encapsulateArray(target: Array<any>): Omit<Array<any>, 'push'> { //TODO: only omit mutating methods that are not own methods
    return new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver)
            if (isExtendedArray(target) && hasOwnPropertyOrMethod(target, key)) {
                if (value instanceof Function) {
                    return (...args: any) => {
                        return value.call(target, ...args)
                    }
                }
                return value;
            }
            if (value instanceof Function && isMutatingArrayMethod(key)) {
                return (...args: any[]) => {
                    if (__DEV__)
                        throw new Error(`This array has be encapsulated and can only be mutated by its provided methods`)
                };
            }
            return value;
        },
        set(target, key, value, receiver) {
            if (__DEV__)
                throw new Error(`This array has be encapsulated and can only be mutated by its provided methods`)
            Reflect.set(target, key, value, receiver)
            return true;
        }
    })
}


function encapsulateObject(target: Object) { //TODO: only omit mutating methods that are not own methods
    return new Proxy(target, {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver)
            if (isExtendedObject(target) && hasOwnPropertyOrMethod(target, key)) {
                return value;
            }
            if (value instanceof Function && isMutatingObjectMethod(key)) {
                return (...args: any[]) => {
                    if (__DEV__)
                        throw new Error(`This object has be encapsulated and can only be mutated by its provided methods`)
                };
            }
            return value;
        },
        set() {
            if (__DEV__)
                throw new Error(`This object has be encapsulated and can only be mutated by its provided methods`)
            return true;
        }
    })
}




function hasOwnPropertyOrMethod(target: Object, key: PropertyKey) {
    return (target.hasOwnProperty(key) || Object.getPrototypeOf(target).hasOwnProperty(key))
}

