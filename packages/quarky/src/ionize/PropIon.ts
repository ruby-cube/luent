import { AnyObject, ReadonlyKeys } from "@rue/types";
import { asMetaIonicModel, isIonicModel, ionize, IonicModel, toRaw } from "./IonicModel";
import { asObservedProp, ObservedProp } from "./ObservedProp";
import { META } from "../ReactiveEntity";



export function isPropIon(value: any): value is PropIon {
    return value[META] instanceof ObservedProp;
}

export type PropIon<T = any> = {
    (): T;
    set: (newValue: T) => T
    [META]: ObservedProp
}

export type ReadonlyPropIon<T = any> = {
    (): T;
    [META]: ObservedProp
}

type Protected = {
    readonly frog: string,
    fluffy: boolean
}




type AsPropIon<T, K extends keyof T> = K extends ReadonlyKeys<T> ? ReadonlyPropIon<T[K]> : PropIon<T[K]>

export function asIon<T extends AnyObject, K extends keyof T>(model: T, key: K): AsPropIon<T, K> {
    const reactive = isIonicModel(model) ? model : ionize(model)
    const propIon = asMetaIonicModel(reactive).getPropIon(key) //TODO: need a map for readonly prop ions too...
    if (propIon) return propIon as AsPropIon<T, K>
    return $Prop(reactive, key) as AsPropIon<T, K>
}

function $Prop<T extends IonicModel, K extends keyof T, P extends T[K]>(reactive: T, key: K): PropIon<P> {
    const rawTarget = toRaw(reactive)
    const meta = asMetaIonicModel(reactive);

    function __$propIon() {
        reregisterIfNeeded()
        return reactive[key];
    }

    const prop = asObservedProp(reactive, key)
    __$propIon.set = (newValue: P) => {
        reregisterIfNeeded()
        return setValue(reactive, key, newValue, rawTarget[key])
    }
    __$propIon[META] = prop;
    // __$propIon.set = (toNewValue:(value: P) => P) => {
    //     reregisterIfNeeded()
    //     const value = rawTarget[key];
    //     return setValue(reactive, key, toNewValue(value), value)
    // }

    meta.registerPropIon(key, __$propIon)
    prop.onDestroy(() => {
        meta.unregisterPropIon(key)
    })

    function reregisterIfNeeded() {
        if (!meta.getPropIon(key)) {
            if (__DEV__) console.warn(`I'm curious how often and in what cases this happens: $propPod for ${key.toString()} in${JSON.stringify(rawTarget)} is no longer observed, but there's still an active reference to it`)
            meta.registerPropIon(key, __$propIon) // This means $propPod is not being watched and is not an atom anywhere, but it's still being used
        }
    }
    return __$propIon
}

function setValue<T>(reactive: IonicModel, key: PropertyKey, newValue: T, oldValue: T) {
    if (oldValue === newValue) return oldValue;
    reactive[key] = newValue;
    return newValue;
}


