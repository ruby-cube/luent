import { emitSignal } from "../debug";
import { isIonicModel, ionize } from "../ionize/IonicModel";
import { getActiveTracker, getDependencyTracker, getWithoutTracking } from "../derivations/DependencyTracker";
import { trigger } from "../trigger";
import { META, ReactiveEntity } from "../ReactiveEntity";
import { AnyObject } from "@rue/types";
import { AnyIon, isAnyIon } from "./AnyIon";
import { ProtectedIon } from "./ProtectedIon";


export type Ion<T = any, M extends AnyObject = {}> = {
    (): T;
    [META]: MetaIon<T>;
    set: (value: T) => T
} & M



// export type ReactiveGet<T = any> = () => T
export type Get<T = any> = () => T

export const ION = Symbol('atomicIon');

export class MetaIon<T = unknown> implements ReactiveEntity {

    type = ION

    asProtected?: ProtectedIon
    asReadonly?: ProtectedIon

    constructor(
        readonly o: Ion<T>,
        public value: T,
        readonly hasIonicValue: boolean = false,
        public hasMethods: boolean = false,
        public inert = false
    ) { }
}


export function Ion<
    T,
    M extends { [key: string]: (...args: any[]) => any }
>(
    value: T,
    methods?: M,
    inert?: boolean
) {
    const metaIon = new MetaIon(<Ion>$ion, value, isIonicModel(value), !!methods, !!inert)

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
        if (inert) return metaIon.value;
        if (__DEV__) emitSignal();
        const tracker = getActiveTracker()
        if (!tracker) return metaIon.value as T
        tracker.track(<Ion>$ion)
        return metaIon.value as T;
    }

    Object.setPrototypeOf($ion, proto)

    return $ion as Ion<T, M>
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
    const _newValue = shouldIonize(newValue, metaIon) ? ionize(newValue) : newValue
    // toIonicModelIfMust(newValue, metaIon)
    metaIon.value = _newValue;
    if (!metaIon.inert) trigger($ion, _newValue, oldValue);
    return _newValue;
}

function shouldIonize(newValue: unknown, metaIon: MetaIon): newValue is AnyObject {
    return newValue instanceof Object && metaIon.hasIonicValue;
}


export function isIon(maybeIon: any): maybeIon is Ion {
    if (maybeIon instanceof Object) return maybeIon[META]?.type === ION;
    return false;
}

export function asMetaIon<T>(ionicEntity: T): T extends { [META]: infer M } ? M : never {
    if (!isAnyIon(ionicEntity)) throw new Error("INVALID INPUT. Must be an ion")
    return ionicEntity[META] as T extends { [META]: infer M } ? M : never
}