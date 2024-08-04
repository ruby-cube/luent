import { ReactiveModel } from "./useReactiveModels";

// This module creates a unique tuple for reactive prop so that reactive props can be used as unique keys in maps

const reactivePropMap: WeakMap<ReactiveModel, Map<PropertyKey, _ReactiveProp>> = new WeakMap()

export type ReactiveProp = [ReactiveModel, PropertyKey]

class _ReactiveProp extends Array {
    constructor(
        model: ReactiveModel,
        key: PropertyKey,
        propMap?: Map<PropertyKey, _ReactiveProp>,
    ) {
        super();
        if (!propMap) {
            propMap = new Map()
            reactivePropMap.set(model, propMap)
        }
        this.push(model, key);
        propMap.set(key, this)
    }
}

export function isReactiveProp(value: any): value is ReactiveProp {
    if (!(value instanceof Object)) return false;
    return value instanceof _ReactiveProp;
}

export function asReactiveProp(
    model: ReactiveModel,
    key: PropertyKey
): ReactiveProp {
    const propMap = reactivePropMap.get(model);
    if (!propMap) return new _ReactiveProp(model, key) as unknown as ReactiveProp;
    const reactiveProp = propMap.get(key);
    if (!reactiveProp) return new _ReactiveProp(model, key, propMap) as unknown as ReactiveProp;
    return reactiveProp as unknown as ReactiveProp
}