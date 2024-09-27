import { emitSignal } from "../debug";
import { isIonicModel, ionize } from "../ionize/IonicModel";
import { getActiveTracker, getDependencyTracker, getWithoutTracking } from "../derivations/DependencyTracker";
import { trigger } from "../trigger";
import { META, ReactiveEntity } from "../ReactiveEntity";
import { isFunctionWithProps } from "@rue/utils";
import { AnyObject } from "@rue/types";
import { AnyIon, isAnyIon } from "./AnyIon";


export type AtomicIon<T = any, M extends AnyObject = {}> = {
    (): T;
    [META]: MetaIon<T>;
    set: (value: T) => T
} & M

export type ProtectedIon<T = any, M extends AnyObject = {}> = {
    (): T;
    [META]: MetaIon<T>;
} & M

// export type ReactiveGet<T = any> = () => T
export type Get<T = any> = () => T

export const ATOMIC_ION = Symbol('atomicIon');

export class MetaIon<T = unknown> implements ReactiveEntity {

    type = ATOMIC_ION

    asProtected?: ProtectedIon
    asReadonly?: ProtectedIon

    constructor(
        readonly o: AtomicIon<T>,
        public value: T,
        readonly hasIonicValue: boolean = false
    ) { }
}


export function AtomicIon<
    T,
    M extends { [key: string]: (...args: any[]) => any }
>(
    value: T,
    methods?: M
) {
    const metaIon = new MetaIon(<AtomicIon>$ion, value, isIonicModel(value))

    const proto = {
        [META]: metaIon,
        set(newValue: any) {
            return setValue(metaIon, newValue, metaIon.value);
        }
    } as AnyObject

    if (methods) {
        for (const key in methods) {
            proto[key] = methods[key].bind(proto) // This makes set function available to `this` even after protected
        }
    }

    function $ion() {
        if (__DEV__) emitSignal();
        const tracker = getActiveTracker()
        if (!tracker) return metaIon.value as T
        tracker.track(<AtomicIon>$ion)
        return metaIon.value as T;
    }

    Object.setPrototypeOf($ion, proto)

    return $ion as AtomicIon<T, M>
}

const READONLY = 'ro'

// protected ion: no set function 
// readonly ion: no methods
// custom protected ion: no set function and only select properties and methods 

/**
 * methodKeys: methodKeys to include in protected ion
 */
function protectIon($ion: AtomicIon, methodKeys?: string[] | typeof READONLY) {
    if (!methodKeys) {
        return asProtectedIon($ion);
    }

    if (methodKeys === READONLY) {
        return asReadonlyIon($ion)
    }

    return asCustomProtectedIon($ion, methodKeys)
}

//@ts-expect-error
protect($count, [
    'increment',
    'decrement'
])

function asCustomProtectedIon($ion: AtomicIon, propertyKeys: string[]) {
    if (isReadonlyIon($ion)) return $ion;
    return createCustomProtectedIon($ion, propertyKeys)
}

function createCustomProtectedIon($ion: AtomicIon, methodKeys: string[]) {
    const meta = asMetaIon($ion);
    const $coreIon = meta.o;
    const proto = Object.getPrototypeOf($coreIon)
    function $customIon() {
        return $coreIon()
    }

    const _methodKeys = new Set(methodKeys)
    if (__DEV__ && _methodKeys.has('set')) {
        console.warn(`'set' function cannot be included in a protected ion.`)
    }

    const customProto = Object.create(proto)
    customProto.set = protectedMethod;
    for (const key in proto) {
        if (!_methodKeys.has(key)) {
            customProto[key] = protectedMethod
        }
    }

    Object.setPrototypeOf($customIon, customProto)

    return $customIon;
}

function protectedMethod() {
    if (__DEV__) console.warn(`[PROTECTED METHOD] Operation failed.`)
}

function asReadonlyIon($ion: AtomicIon) {
    if (isReadonlyIon($ion)) return $ion;
    const meta = asMetaIon($ion);
    const existing = meta.asReadonly;
    if (existing) return existing;
    return createReadonlyIon(meta);
}

function createReadonlyIon(meta: MetaIon) {
    const $coreIon = meta.o

    function $readonlyIon() {
        return $coreIon()
    }
    $readonlyIon[META] = meta;

    meta.asReadonly = $readonlyIon;
    return $readonlyIon;
}


function asProtectedIon($ion: AtomicIon) {
    if (isProtectedIon($ion) || isReadonlyIon($ion)) {
        return $ion
    }
    const meta = asMetaIon($ion)
    const existing = meta.asProtected
    if (existing) {
        return existing;
    }
    return createProtectedIon(meta);
}

function createProtectedIon(meta: MetaIon) {
    const $coreIon = meta.o

    const proto = Object.create(Object.getPrototypeOf($coreIon))
    proto.set = () => {
        console.warn(`Set operation failed. Ions cannot be set outside of their own methods`)
    }

    function $protectedIon() {
        return $coreIon()
    }

    Object.setPrototypeOf($protectedIon, proto)

    meta.asProtected = $protectedIon as ProtectedIon
    return $protectedIon
}

function isProtectedIon($ion: ProtectedIon) {
    const meta = asMetaIon($ion)
    return meta.asProtected === $ion
}

function isReadonlyIon($ion: ProtectedIon) {
    const meta = asMetaIon($ion)
    return meta.asReadonly === $ion
}

// function attachMethods(methods: { [key: string]: Function }, proto: AnyObject) {
//     for (const key in methods) {
//         proto[key] = function performMethod(...args: any[]) {
//             if (!methodAllowed()) throw new Error("Object is protected from this method")
//             setAllowed = true;
//             const output = methods![methodKey](...args)
//             setAllowed = false;
//             methodKey = "";
//             return output;
//         }
//     }
// }

// function wrapIonMethods(
//     proto: IonPrototype<any, any>,
//     methods: { [key: string]: (...args: any[]) => any },
//     mutate: (...args: any[]) => any
// ) {
//     for (const key in methods) {
//         proto[key] = wrapIonMethod(methods[key])
//     }
// }

// function wrapIonMethod(method: Function, key: string) {
//     return function performMethod(...args: any[]) {
//         if (!methodAllowed()) throw new Error("Object is protected from this method")
//         setAllowed = true;
//         const output = methods![methodKey](...args)
//         setAllowed = false;
//         methodKey = "";
//         return output;
//     }
// }






// function set<T>(this: MetaIon, toNewValue: (value: T) => T) {
//     const value = this.value as T;
//     return setValue(this, toNewValue(value), value);
// }

// ORDER:
// - set value
// - trigger effects (run sync effects, schedule effects)
// - trigger derivations effects (run sync effects, schedule effects)

function setValue(metaIon: MetaIon, newValue: unknown, oldValue: unknown) {
    if (oldValue === newValue) return oldValue;
    const $ion = metaIon.o;
    const _newValue = shouldMakeIonic(newValue, metaIon) ? ionize(newValue) : newValue
    // toIonicModelIfMust(newValue, metaIon)
    metaIon.value = _newValue;
    trigger($ion, _newValue, oldValue);
    return _newValue;
}

function shouldMakeIonic(newValue: unknown, metaIon: MetaIon): newValue is AnyObject {
    return newValue instanceof Object && metaIon.hasIonicValue;
}


export function isIon(maybeIon: any): maybeIon is AtomicIon {
    if (maybeIon instanceof Object) return maybeIon[META]?.type === ATOMIC_ION;
    return false;
}

export function asMetaIon<T extends AnyIon>(ionicEntity: T): T extends { [META]: infer M } ? M : never {
    if (!isAnyIon(ionicEntity)) throw new Error("INVALID INPUT. Must be an ion")
    return ionicEntity[META] as T extends { [META]: infer M } ? M : never
}