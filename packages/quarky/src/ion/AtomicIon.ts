import { emitSignal } from "../debug";
import { isIonicModel, ionize } from "../ionize/ionize";
import { getActiveTracker, getDependencyTracker, getWithoutTracking } from "../derivations/DependencyTracker";
import { trigger } from "../trigger";
import { META, ReactiveEntity } from "../ReactiveEntity";
import { AnyObject } from "@rue/types";
import { AnyIon, isIon } from "./Ion";
import { IS_PUBLIC, ProtectedIon } from "./ProtectedIon";

export type AtomicIon<T = any, M extends AnyObject = {}> = ((selected?: true) => T)
    & {
        [META]: MetaIon<T>;
    } & {[K in keyof UnmarkedMethods<M>]:UnmarkedMethods<M>[K]} & (UnmarkedMethods<M> extends { as: any } ? { _as: (value: T) => T } : { as: (value: T) => T })

type UnmarkedMethods<M> = { [K in keyof M as K extends `XPO${infer S}` ? S : K]: M[K] }

export const ION = Symbol('atomicIon');

export class MetaIon<T = unknown> implements ReactiveEntity {

    type = ION

    asProtected?: ProtectedIon
    asReadonly?: ProtectedIon

    constructor(
        readonly o: AtomicIon<T>,
        public value: T,
        readonly hasIonicValue: boolean = false,
        public hasMethods: boolean = false,
        public inert = false
    ) { }
}


export function createAtomicIon<
    T,
    M extends { [key: string]: (...args: any[]) => any }
>(
    value: T,
    methods?: M,
    inert?: boolean
) {
    const metaIon = new MetaIon(<AtomicIon>$ion, value, isIonicModel(value), !!methods, !!inert)

    const setterKey = methods && ('as' in methods || 'XPOas' in methods) ? "_as" : 'as'

    const proto = {
        [META]: metaIon,
        [setterKey](newValue: any) {
            return setValue(metaIon, newValue, metaIon.value);
        }
    } as AnyObject

    if (methods) {
        attachIonMethods(proto, methods)
    }

    function $ion(selected?: boolean) {
        if (inert) return metaIon.value;
        if (__DEV__) emitSignal();
        const tracker = getActiveTracker()
        if (!tracker || tracker.selective && !selected)
            return metaIon.value as T
        tracker.track(<AtomicIon>$ion)
        return metaIon.value as T;
    }

    Object.setPrototypeOf($ion, proto)

    return $ion as AtomicIon<T, M>
}

export function attachIonMethods(proto: AnyObject, methods: AnyObject){
    for (const key in methods) {
        const isPublic = key.startsWith('XPO');
        const method = proto[isPublic ? key.slice(3) : key] = methods[key]
        if (isPublic) {
            method[IS_PUBLIC] = true;
        }
        // .bind(proto) // This makes set function available to `this` even after protected //QUESTION: I don't think this is needed if `this` is not used...
    }
    return proto;
}

// ORDER:
// - set value
// - trigger effects (run sync effects, schedule effects)
// - trigger derivations effects (run sync effects, schedule effects)

function setValue(metaIon: MetaIon, newValue: unknown, oldValue: unknown) {
    if (oldValue === newValue) return oldValue;
    const $ion = metaIon.o;
    const _newValue = shouldIonize(newValue, metaIon) ? ionize(newValue) : newValue
    // toIonicModelIfMust(newValue, metaIon)
    metaIon.value = _newValue;
    if (!metaIon.inert) trigger($ion, _newValue, oldValue);
    return _newValue;
}

function shouldIonize(newValue: unknown, metaIon: MetaIon): newValue is AnyObject {
    return newValue instanceof Object && metaIon.hasIonicValue;
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


export function isAtomicIon(maybeIon: any): maybeIon is AtomicIon {
    if (maybeIon instanceof Object) return maybeIon[META]?.type === ION;
    return false;
}

export function asMetaIon<T>(ionicEntity: T): T extends { [META]: infer M } ? M : never {
    if (!isIon(ionicEntity)) throw new Error("INVALID INPUT. Must be an ion")
    return ionicEntity[META] as T extends { [META]: infer M } ? M : never
}