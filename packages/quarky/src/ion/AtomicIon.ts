import { emitSignal } from "../debug";
import { isIonicModel, ionize } from "../ionize/IonicModel";
import { getActiveTracker, getDependencyTracker, getWithoutTracking } from "../derivations/DependencyTracker";
import { trigger } from "../trigger";
import { META, ReactiveEntity } from "../ReactiveEntity";
import { isFunctionWithProps } from "@rue/utils";
import { AnyObject } from "@rue/types";
import { AnyIon } from "./AnyIon";


export type AtomicIon<T = any, M extends AnyObject = {}> = {
    (): T;
} & IonPrototype<T, M>

type IonPrototype<T, M> = {
    [META]: MetaIon<T>;
    set: (value: T) => T
} & M

// export type ReactiveGet<T = any> = () => T
export type Get<T = any> = () => T



export const ATOMIC_ION = Symbol('atomicIon');

export class MetaIon<T = unknown> implements ReactiveEntity {

    type = ATOMIC_ION

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
    let metaIon: MetaIon
    // let methodKey: keyof M = ""

    // const $ionProxy = new Proxy($ion, {
    //     get(target, key, receiver) {
    //         if (key === META) return metaIon;
    //         if (methods && key in methods) {
    //             return mutate;
    //         }
    //         return Reflect.get(target, key, receiver)
    //     },
    //     apply(target) {
    //         return target()
    //     },
    // }) as AtomicIon


    function $ion() {
        if (__DEV__) emitSignal();
        const tracker = getActiveTracker()
        if (!tracker) return metaIon.value as T
        tracker.track(<AtomicIon>$ion)
        return metaIon.value as T;
    }

    metaIon = new MetaIon(<AtomicIon>$ion, value, isIonicModel(value))

    const proto = {
        [META]: metaIon,
        set: set.bind(metaIon),
        ...methods || {}
    }

    // if (methods) {
    //     wrapIonMethods(proto, methods, mutate) // prevents infinite loops if ion is set in an ionic effect and calls itself. But what if it doesn't mutate and needs to be tracked? Are there cases like this? Yes, e.g. a method that is isEqualToZero()
    // }

    Object.setPrototypeOf(proto, Object.getPrototypeOf($ion)) //QUESTION: Not sure if I should consider $ion a function or not, but this allows `$ion instanceof Function` to evaluate to true
    Object.setPrototypeOf($ion, proto)

    // function mutate(...args: any[]) {
    //     const tracker = getDependencyTracker();
    //     tracker?.stop();
    //     const output = methods![methodKey](...args)
    //     tracker?.restore();
    //     methodKey = "";
    //     return output;
    // }

    return $ion as AtomicIon<T, M>
}

// function wrapIonMethods(
//     proto: IonPrototype<any, any>,
//     methods: { [key: string]: (...args: any[]) => any },
//     mutate: (...args: any[]) => any
// ) {
//     for (const key in methods) {
//         proto[key] = mutate
//     }
// }




function set<T>(this: MetaIon, newValue: T) {
    return setValue(this, newValue, this.value);
}

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
    trigger($ion);
    return _newValue;
}

function shouldMakeIonic(newValue: unknown, metaIon: MetaIon): newValue is AnyObject {
    return newValue instanceof Object && metaIon.hasIonicValue;
}


export function isIon<T>(maybeIon: T): maybeIon is T extends AtomicIon ? T : never {
    if (isFunctionWithProps(maybeIon)) return maybeIon[META]?.type === ATOMIC_ION;
    return false;
}

export function getMetaIon<T extends object>(ionicEntity: T): T extends { [META]: infer M } ? M : never { 
    if (!(META in ionicEntity)) throw new Error("INVALID INPUT. Must have a META property")
    return ionicEntity[META] as T extends { [META]: infer M } ? M : never
}