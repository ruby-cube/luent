import { ion, AtomicIon } from "@rue/quarky";
import { AnyObject } from "@rue/types";
import { toIon } from "../../../quarky/src/ion/toIons";

let currentSetup: AnyObject | undefined;

export function setSetup(setup: AnyObject | undefined) {
    currentSetup = setup;
}

type SetupProps<T, N> = T extends AnyObject ? {
    [K in keyof TypedSetupProps<T, N>]:
    `?` extends TypedSetupProps<T, N>[K] ? `ion` extends TypedSetupProps<T, N>[K] ? AtomicIon<Exclude<TypedSetupProps<T, N>[K], '?' | 'ion'>> | undefined : Exclude<TypedSetupProps<T, N>[K], '?'> | undefined :
    `ion` extends TypedSetupProps<T, N>[K] ? AtomicIon<Exclude<TypedSetupProps<T, N>[K], 'ion'>>
    : TypedSetupProps<T, N>[K]
}
    : T extends undefined ? AnyObject : AnyObject

type TypedSetupProps<T extends AnyObject, N> = {
    [K in keyof T]: T[K] extends (infer I)[] ?
    I extends string ? `?` :
    I extends undefined ? undefined :
    I extends (value: unknown) => value is infer T ? T :
    I extends { useDefault: () => infer T } ? T :
    I extends ((value: unknown) => AtomicIon<unknown>)[] ? `ion`
    : never : never
}
// & {
//     [K in keyof T]-?: T[K] extends string[] ? 'optional' : never
// }


class Bog {
    frog: string = 'gj'
}

// interface Bog {

// }

class Hog {
    pig: true = true
}

const $count = ion(0, { set() { } })



const { dog, cat, count } = $setup({
    dog: ['?', isFrog, is(Bog, Hog), or(() => [90]), [toIon]],
    count: ['?', is(Number, String), [toIon]],
    cat: [is(Bog, Hog), undefined, [toIon]]
})

type Frog = {
    blind: true
}

function isFrog(value: any): value is Frog {
    return true;
}

//API
export function $setup<T, N>(validationAndNormalization?: T, normalize?: N & { all: ((value: any) => any) }): SetupProps<T, N> {
    if (!validationAndNormalization)
        return currentSetup as SetupProps<T, N>
    return validateAndNormalize(currentSetup, validationAndNormalization, normalize?.all) as SetupProps<T, N>
}

type ValidationConfig = {
    [key: string]: (
        ((value: unknown) => boolean)
        | undefined
        | `?`
        | { useDefault: () => unknown }
        | { isNotForbiddenType: (value: unknown) => boolean }
        | ((value: unknown) => unknown)[]
    )[]
}

function validateAndNormalize(setup: AnyObject | undefined, validationAndNormalization: ValidationConfig, normalizeAll?: (value: any) => any) {
    if (!setup) {
        throw new Error(`$setup() must be called within a component setup`)
    }
    for (const key in validationAndNormalization) {
        const config = validationAndNormalization[key];

        let value = setup[key];
        let optional = false;
        let canBeUndefined = false;
        let valid = false;
        let _toIon;
        for (const process of config) {
            if (process === '?') {
                optional = true;
            }
            else if (process === undefined) {
                canBeUndefined = true;
            }
            else if (!valid && process instanceof Function) {
                if (process(value))
                    valid = true;
            }
            else if (process instanceof Array) {
                if (process.length > 1) throw new Error(``)
                if (process[0] !== toIon) throw new Error(``)
                _toIon = process[0];
            }
            else if (process instanceof Object) {
                if ('useDefault' in process) {
                    if (value === undefined)
                        value = process.useDefault()
                    continue;
                }
                else if ('isNotForbiddenType' in process) {
                    if (process.isNotForbiddenType(value))
                        continue;
                    throw new Error(``)
                }
            }
        }
        if (!valid) throw new Error(``)
        if (value === undefined && (!optional || !canBeUndefined))
            throw new Error(``)
        if (_toIon && !(optional && value === undefined)) {
            value = _toIon(value);
        }
        if (normalizeAll) {
            if (normalizeAll !== toIon) throw new Error(``)
            value = normalizeAll(value)
        }
        setup[key] = value;
    }
    return setup;
}

// (value: unknown) => value is InstanceType<T>

type IsConstructorType<T> = (value: unknown) => value is T extends (infer C)[] ?
    C extends StringConstructor ? string :
    C extends BooleanConstructor ? boolean :
    C extends NumberConstructor ? number :
    InstanceType<C extends abstract new (...args: any) => any ? C : never> : never


//API
export function is<T extends (abstract new (...args: any) => any)[]>(...constructors: T): IsConstructorType<T> {
    return (function isAnyOfSpecifiedClasses(value: any) {
        for (const constructor of constructors) {
            if (constructor === Number && typeof value === 'number') {
                return true;
            }
            else if (constructor === String && typeof value === 'string') {
                return true;
            }
            else if (constructor === Boolean && typeof value === 'boolean') {
                return true;
            }
            else if (value instanceof constructor)
                return true;
        }
        return false;
    }) as IsConstructorType<T>
}


//API
export function not(...validators: Function[]) {
    return {
        isNotForbiddenType(value: any) {
            for (const isType of validators) {
                if (isType(value)) false;
            }
            return true;
        }
    }
}

//API
export function or<T extends () => unknown>(useDefault: T): { useDefault: T } {
    return {
        useDefault
    }
}

//API
export function isAny(value: any): value is any {
    return true;
}

//API
export function isDefined(value: any): value is string | number | boolean | object | symbol | null {
    if (value === undefined) return false;
    return true;
}



// String
// Number
// Boolean
//-------
// Array
// Object
// Date
// Function
// Symbol
// Error


// export function TestCleanupScheduler({
//     name,
//     date,
//     dateB,
//     address,
//     town
// } = $setup({
//     name: is(String),
//     nameB: [is(String, Number), undefined, [toIon]], // {nameB: AtomicIon<String | Number | undefined>} 
//     nameB: ['?', is(String, Number), [toIon]], // {nameB?: AtomicIon<String | Number>}
//     date: [is(Date, String, Number), isAntelop, undefined],
//     dateB: [is(Date), or(() => new Date())],
//     dateB: [isDefined, or(() => new Date())],
//     address: [is(Address), not(isAtomicIon, is(Map))],
//     message: isAny
// }, { all: toIon })) {