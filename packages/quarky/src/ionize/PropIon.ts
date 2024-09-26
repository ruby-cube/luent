import { AnyObject } from "@rue/types";
import { asMetaIonicModel, isIonicModel, ionize, IonicModel, toRaw } from "./IonicModel";
import { asObservedProp, ObservedProp } from "./ObservedProp";
import { META } from "../ReactiveEntity";

// export function $Props<T extends AnyObject, K extends keyof T>(model: T, keys: K[]) {
//     const reactive = isIonicModel(model) ? model : ionize(model)
//     const propsSignal = asMetaIonicModel(reactive).getMultiPropIon(keys.toString())
//     if (propsSignal) return propsSignal;
//     return $MultiPropsSignal(reactive, keys)
// }

export function isPropIon(value: any): value is PropIon {
    if (!(value instanceof Function)) return false;
    return value.name === "__$propIon"
}

export type PropIon<T = any> = {
    (): T;
    set: (newValue: T) => T
    [META]: ObservedProp
}

export function asIon<T extends AnyObject, K extends keyof T>(model: T, key: K): PropIon<T[K]> {
    const reactive = isIonicModel(model) ? model : ionize(model)
    const propIon = asMetaIonicModel(reactive).getPropIon(key)
    if (propIon) return propIon;
    return $Prop(reactive, key)
}

function $Prop<T extends IonicModel, K extends keyof T, P extends T[K]>(reactive: T, key: K): PropIon<P> {
    const rawTarget = toRaw(reactive)
    const meta = asMetaIonicModel(reactive);

    function __$propIon() {
        reregisterIfNeeded()
        return reactive[key];
    }

    __$propIon.set = (newValue: P) => {
        reregisterIfNeeded()
        return setValue(reactive, key, newValue, rawTarget[key])
    }
    const prop = asObservedProp(reactive, key)
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


