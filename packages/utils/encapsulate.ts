import { AnyObject } from "@luently/types";

const ENCAPSULATED = Symbol('encapsulated')

// class MyArray extends Array {
//     constructor() {
//         super()
//     }

//     mush() {

//     }

//     push(a: any) {
//         return super.push(a)
//     }
// }

// type EncapsulatedArray = Encapulated<MyArray, 'push'>

type MutatingArrayMethods = 'push' | 'pop' | 'splice' | 'shift' | 'unshift' | 'fill'
type MutatingSetMethods = 'add' | 'delete' | 'clear'
type MutatingMapMethods = 'set' | 'delete' | 'clear'

export type Encapulated<
    T extends AnyObject,
    OverriddenMethods extends string
> = Readonly<Omit<T,
    Exclude<
        T extends Array<any> ? MutatingArrayMethods
        : T extends Set<any> ? MutatingSetMethods
        : T extends Map<any, any> ? MutatingMapMethods
        : '',
        OverriddenMethods
    >
>>



export function encapsulate<T extends AnyObject>(target: T): T {
    if (ENCAPSULATED in target) return target;
    if (!(target instanceof Object)) {
        if ( __DEV__) console.warn('Invalid input')
        return target;
    }

    const encapsulatedObject = new Proxy(target, {
        get(target, key, receiver) {
            const value: any = Reflect.get(target, key, receiver)
            const DataStructure = getBaseDataStructure(target);
            if (inheritsFrom(DataStructure, target) && hasOwnPropertyOrMethod(target, key)) {
                if (isFunction(value)) {
                    return (...args: any) => {
                        return value.call(target, ...args)
                    }
                }
                return value instanceof Object ? encapsulate(value) : value;
            }
            if (isFunction(value) && isMutatingMethod(DataStructure, key)) {
                return (...args: any[]) => {
                    if ( __DEV__)
                        throw new Error(`This object has be encapsulated and can only be mutated by its provided methods`)
                };
            }
            return value instanceof Object ? encapsulate(value) : value;
        },
        set(target, key, value, receiver) {
            if ( __DEV__ && key !== ENCAPSULATED)
                throw new Error(`This object has be encapsulated and can only be mutated by its provided methods`)
            Reflect.set(target, key, value, receiver)
            return true;
        }
    }) as T & { [ENCAPSULATED]: true }
    // as Omit<AnyObject, 'push'>  // TODO: only omit mutating methods that are not own methods
    encapsulatedObject[ENCAPSULATED] = true;
    return encapsulatedObject
}

function getBaseDataStructure(target: Object) {
    if (Array.isArray(target)) return Array;
    if (target instanceof Object) return Object;
    throw new Error('Invalid Input')
}



// function inheritsFrom(DataStructure: typeof Array | typeof Object, target: any){
//     switch (DataStructure) {
//         case Object:
//             return inheritsFromObject(target);

//         case Array:
//             return inheritsFromArray(target);

//         default:
//             throw new Error('Invalid Input')
//     }
// }

export function inheritsFrom(DataStructure: Function, entity: any) {
    return entity instanceof DataStructure && Object.getPrototypeOf(entity).constructor !== DataStructure
}


const mutatingArrayOps = {
    // changes length
    push: true, // will change length
    unshift: true, // will change length

    pop: true, // will change length (unless already empty)
    shift: true, //  will change length (unless already empty)

    splice: true, // may or may not change length (many different cases to check)

    // length will not change (index will change)
    reverse: true, // may or may not change array (no change if length === 0 || 1)
    sort: true, // may or may not change array (no change if length === 0 || 1   or if array already sorted)
    fill: true, // may or may not change array (no change if array already filled with the item or length === 0)
    copyWithin: true, // may or may not change array (no change if items all the same or length === 0)
};

export const mutatingSetOps = {
    add: true,
    delete: true,
    clear: true
}

export const mutatingMapOps = {
    set: true,
    delete: true,
    clear: true
}


function isMutatingMethod(DataStructure: typeof Array | typeof Object | typeof Set | typeof Map, key: PropertyKey) {
    switch (DataStructure) {
        case Object:
            return false;

        case Array:
            return isMutatingArrayMethod(key);

        case Set:
            return isMutatingSetMethod(key);

        case Map:
            return isMutatingMapMethod(key);

        default:
            throw new Error('Invalid Input')
    }
}


export function isMutatingArrayMethod(key: PropertyKey) {
    return key in mutatingArrayOps;
}

export function isMutatingSetMethod(key: PropertyKey) {
    return key in mutatingSetOps;
}

export function isMutatingMapMethod(key: PropertyKey) {
    return key in mutatingMapOps;
}


function hasOwnPropertyOrMethod(target: Object, key: PropertyKey) {
    return (target.hasOwnProperty(key) || Object.getPrototypeOf(target).hasOwnProperty(key))
}

