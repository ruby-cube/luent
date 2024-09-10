import { ReactiveAtom } from "../derivations/ReactiveAtom";
import { unwatch, watch, Watchable } from "../effects/Watchable";
import { WatchTarget } from "../effects/WatchTarget";
import { destroyAsAtom, initializeAsAtom, ReactivePrimitive } from "../ReactivePrimitive";
import { MetaReactiveModel, REACTIVE_MODEL_MARKER, ReactiveModel } from "./ReactiveModel";

// This module creates a unique tuple for reactive prop so that reactive props can be used as unique keys in maps

// Since reactive prop has a reference to ReactiveModel, a WeakMap will cause a memory leak
// We must manually delete entries
// const reactivePropMap: Map<ReactiveModel, Map<PropertyKey, ObservedProp>> = new Map()
const KEY = '1'
const MODEL = '0'

// export type ObservedProp = [ReactiveModel, PropertyKey]

export class ObservedProp extends Array implements ReactivePrimitive, Watchable{

    constructor(
        metaReactive: MetaReactiveModel,
        key: PropertyKey,
    ) {
        super();
        metaReactive.registerObservedProp(key, this)
        this.push(metaReactive, key);
    }

    destroy() {
        (<MetaReactiveModel>this[MODEL]).unregisterObservedProp(this[KEY])
    }

    asAtom?: ReactiveAtom | undefined;
    initializeAsAtom = initializeAsAtom
    destroyAsAtom = destroyAsAtom

    asWatchTarget?: WatchTarget<any> | undefined;
    watch = watch;
    unwatch = unwatch;
}

export function isObservedProp(value: any): value is ObservedProp {
    if (!(value instanceof Object)) return false;
    return value instanceof ObservedProp;
}

export function asObservedProp(
    model: ReactiveModel,
    key: PropertyKey
): ObservedProp {
    const metaReactive = model[REACTIVE_MODEL_MARKER]
    let prop = metaReactive.getObservedProp(key);
    if (prop) return prop;
    prop = new ObservedProp(metaReactive, key);
    return prop
}

export function getObservedPropValue(prop: ObservedProp) {
    const [target, key] = prop
    return target[key];
}