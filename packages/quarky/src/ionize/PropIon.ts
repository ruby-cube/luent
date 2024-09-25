import { AnyObject } from "@rue/types";
import { getMetaReactive, isIonicModel, ionize, IonicModel, toRaw } from "./IonicModel";
import { asObservedProp } from "./ObservedProp";

// export function $Props<T extends AnyObject, K extends keyof T>(model: T, keys: K[]) {
//     const reactive = isIonicModel(model) ? model : ionize(model)
//     const propsSignal = getMetaReactive(reactive).getMultiPropIon(keys.toString())
//     if (propsSignal) return propsSignal;
//     return $MultiPropsSignal(reactive, keys)
// }

export function isPropIon(value: any): value is PropIon {
    if (!(value instanceof Function)) return false;
    return value.name === "__$propIon"
}

export type PropIon<T = any> = {
    (): T;
    setTo: (newValue: T) => T
    set: (toNewValue: (value: T) => T) => T
}

export function asIon<T extends AnyObject, K extends keyof T>(model: T, key: K) {
    const reactive = isIonicModel(model) ? model : ionize(model)
    const propPod = getMetaReactive(reactive).getPropIon(key)
    if (propPod) return propPod;
    return $Prop(reactive, key)
}

function $Prop<T extends IonicModel, K extends keyof T, P extends T[K]>(reactive: T, key: K): PropIon<P> {
    const rawTarget = toRaw(reactive)
    const meta = getMetaReactive(reactive);

    function __$propIon() {
        reregisterIfNeeded()
        return reactive[key];
    }

    __$propIon.setTo = (newValue: P) => {
        reregisterIfNeeded()
        return setValue(reactive, key, newValue, rawTarget[key])
    }
    __$propIon.set = (toNewValue:(value: P) => P) => {
        reregisterIfNeeded()
        const value = rawTarget[key];
        return setValue(reactive, key, toNewValue(value), value)
    }

    meta.registerPropIon(key, __$propIon)
    const prop = asObservedProp(reactive, key)
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


