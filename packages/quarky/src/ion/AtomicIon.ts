import { emitSignal } from "../debug";
import { isIonicModel, ionize } from "../ionize/IonicModel";
import { getActiveTracker, getDependencyTracker, getWithoutTracking } from "../derivations/DependencyTracker";
import { trigger } from "../trigger";
import { META, ReactiveEntity } from "../ReactiveEntity";
import { isFunctionWithProps } from "@rue/utils";
import { AnyObject } from "@rue/types";


export type AtomicIon<T = any, M extends AnyObject = { setTo: (newValue: T) => T }> = {
    (): T;
    [META]: MetaIon<T>;
    // setTo: (newValue: T) => T
    // set: (toNewValue: (value: T) => T) => T
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
    S extends { [key: string]: (...args: any[]) => T } = { setTo: (newValue: T) => T },
    M extends { [key: string]: (...args: any[]) => T } = { setTo: (newValue: T) => T }
>(
    value: T,
    methodsOrSetter?: { set?: S, methods?: M } | ((...args: any[]) => any)
) {
    let metaIon: MetaIon
    let setterKey: keyof S | 'setTo' = ""
    const setter = methodsOrSetter instanceof Function ? methodsOrSetter : (value: T) => value;
    const _setters = methodsOrSetter && !(methodsOrSetter instanceof Function) && methodsOrSetter.set ? methodsOrSetter.set : {
        setTo: setter,
    } as S & { setTo: (value: T) => T }
    const _methods = !(methodsOrSetter instanceof Function) ? methodsOrSetter?.methods : undefined
    const $ionProxy = new Proxy($ion, {
        get(target, key, receiver) {
            if (key === META) return metaIon;
            if (_setters && key in _setters) {
                setterKey = key as keyof S;
                return mutate;
            }
            if (_methods && key in _methods) {
                return _methods[<keyof M>key]
            }
            return Reflect.get(target, key, receiver)
        },
        apply(target) {
            return target()
        },
    }) as AtomicIon

    function $ion() {
        if (__DEV__) emitSignal();
        const tracker = getActiveTracker()
        if (!tracker) return metaIon.value as T
        tracker.track($ionProxy)
        return metaIon.value as T;
    }

    metaIon = new MetaIon($ionProxy, value, isIonicModel(value))

    // $ion[META] = metaIon;
    // $ion.setTo = setTo.bind(metaIon);
    // $ion.set = set.bind(metaIon);


    function mutate(...args: any[]) {
        const tracker = getDependencyTracker();
        tracker?.stop();
        const newValue = setValue(metaIon, _setters[setterKey](...args), metaIon.value);
        tracker?.restore();
        setterKey = "";
        return newValue;
    }

    // return $ion as AtomicIon<T>;


    return $ionProxy as unknown as AtomicIon<T, S & M>
}




// function setTo<T>(this: MetaIon, newValue: T) {
//     return setValue(this, newValue, this.value);
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

export function getMetaIon<T>($ion: AtomicIon<T>): MetaIon<T> {
    return $ion[META]
}