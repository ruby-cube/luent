import { AnyObject } from "@rue/types";
import { getMetaReactive, isReactiveModel, o$, ReactiveModel, toRaw } from "./ReactiveModel";
import { asObservedProp } from "./ObservedProp";
import { asReactiveAtom } from "../derivations/ReactiveAtom";
import { asWatchTarget } from "../effects/WatchTarget";
import { $ } from "../derivations/DerivedSignal";

// export function $Props<T extends AnyObject, K extends keyof T>(model: T, keys: K[]) {
//     const reactive = isReactiveModel(model) ? model : o$(model)
//     const propsSignal = getMetaReactive(reactive).getMultiPropSignal(keys.toString())
//     if (propsSignal) return propsSignal;
//     return $MultiPropsSignal(reactive, keys)
// }

export function $Props<T extends AnyObject, K extends keyof T>(reactive: ReactiveModel<T>, keys: K[]) {
    const propsSignal = $(() => {
        const values = []
        for (const key of keys) {
            values.push(reactive[key])
        }
        return values;
    })
    // getMetaReactive(reactive).registerMultiPropSignal(keys.toString(), propsSignal)
    return propsSignal
}

export type PropSignal<T = any> = {
    (): T;
    update: (toNewValue: (value: T) => T) => T
    setTo: (newValue: T) => T
}

export function $prop<T extends AnyObject, K extends keyof T>(model: T, key: K) {
    const reactive = isReactiveModel(model) ? model : o$(model)
    const propSignal = getMetaReactive(reactive).getPropSignal(key)
    if (propSignal) return propSignal;
    return $Prop(reactive, key)
}

function $Prop<T extends ReactiveModel, K extends keyof T, P extends T[K]>(reactive: T, key: K) {
    const rawTarget = toRaw(reactive)
    const meta = getMetaReactive(reactive);

    function $propSignal() {
        reregisterIfNeeded()
        return reactive[key];
    }

    $propSignal.setTo = (newValue: P) => {
        reregisterIfNeeded()
        const value = rawTarget[key];
        return setValue(reactive, key, newValue, value)
    }

    $propSignal.update = (toNewValue: (value: P) => P) => {
        reregisterIfNeeded()
        const value = rawTarget[key];
        const newValue = toNewValue(value)
        return setValue(reactive, key, newValue, value)
    }

    meta.registerPropSignal(key, $propSignal)

    const atom = asReactiveAtom(asObservedProp(reactive, key))
    const watchTarget = asWatchTarget($propSignal)

    atom.onUntracked(unobserve)
    watchTarget.onUnwatched(unobserve)

    function unobserve() {
        if (watchTarget.watchCount === 0 && atom.derivations.size === 0) {
            meta.unregisterPropSignal(key)
        }
    }

    function reregisterIfNeeded(){
        if (!meta.getPropSignal(key)) {
            if (__DEV__) console.warn(`I'm curious how often and in what cases this happens: $propSignal for ${key.toString()} in${JSON.stringify(rawTarget)} is no longer observed, but there's still an active reference to it`)
            meta.registerPropSignal(key, $propSignal) // This means $propSignal is not being watched and is not an atom anywhere, but it's still being used
        }
    }

    return $propSignal;
}

function setValue<T>(reactive: ReactiveModel, key: PropertyKey, newValue: T, oldValue: T) {
    if (oldValue === newValue) return oldValue;
    reactive[key] = newValue;
    return newValue;
}


