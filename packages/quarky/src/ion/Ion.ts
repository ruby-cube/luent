import { emitSignal } from "../debug";
import { isIonicModel, ionize } from "../ionize/ionize";
import { getActiveTracker, getDependencyTracker, getWithoutTracking } from "../derivations/DependencyTracker";
import { trigger } from "../trigger";
import { META, ReactiveEntity } from "../ReactiveEntity";
import { AnyObject } from "@rue/types";
import { AnyIon, isAnyIon } from "./AnyIon";
import { ProtectedIon } from "./ProtectedIon";
import { createDerivedIon, createWritableDerivedIon, ReactiveDerivedIon } from "../derivations/DerivedIon";
import { asPropIon } from "../ionize/PropIon";


export type Ion<T = any, M extends AnyObject = {}> = {
    (selected?: true): T
    [META]: MetaIon<T>;
    as: (value: T) => T
} & M



// export type ReactiveGet<T = any> = () => T
// export type Get<T = any> = () => T

type ReactiveIon<T, M> = M extends { [key: string]: (...args: any[]) => any } ? Ion<T, M> : Ion<T>


// API
export function ion<T, M>(value?: T & (() => unknown), methods?: M & { [key: string]: (...args: any[]) => any }): T extends () => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
export function ion<T, M>(value?: T, methods?: M & { [key: string]: (...args: any[]) => any }): ReactiveIon<T, M>
export function ion<T, M>(value?: T, methods?: M & { [key: string]: (...args: any[]) => any }): T extends AnyIon ? T : T extends () => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M> {
    if (isAnyIon(value)) {
        if (__DEV__ && methods) console.warn(`Cannot make an existing ion into an ion. Methods will not be attached`)
        return value as T extends AnyIon ? T : T extends () => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
    }
    if (value instanceof Function) {
        if (methods) return createWritableDerivedIon(<()=>unknown>value, methods) as T extends AnyIon ? T : T extends () => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
        return createDerivedIon(<()=>unknown>value) as T extends AnyIon ? T : T extends () => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
    }
    return createIon(value, methods) as T extends AnyIon ? T : T extends () => infer R ? ReactiveDerivedIon<R, M> : ReactiveIon<T, M>
}

ion.from = asPropIon

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


export function createIon<
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
        as(newValue: any) {
            return setValue(metaIon, newValue, metaIon.value);
        }
    } as AnyObject

    if (methods) {
        for (const key in methods) {
            if (key === 'as') {
                if(__DEV__) console.warn(`'as' is reserved for the native set method for ions. Choose different method name`)
                continue;
            } 
            proto[key] = methods[key].bind(proto) // This makes set function available to `this` even after protected
        }
    }

    function $ion(selected?: boolean) {
        if (inert) return metaIon.value;
        if (__DEV__) emitSignal();
        const tracker = getActiveTracker()
        if (!tracker || tracker.selective && !selected)
            return metaIon.value as T
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