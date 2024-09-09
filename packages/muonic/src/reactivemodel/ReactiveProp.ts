import { ReactiveAtom } from "../derivations/ReactiveAtom";
import { _destroyAsAtom, _initializeAsAtom, ReactivePrimitive } from "../ReactivePrimitive";
import { ReactiveModel } from "./Reactive$";

// This module creates a unique tuple for reactive prop so that reactive props can be used as unique keys in maps

// Since reactive prop has a reference to ReactiveModel, a WeakMap will cause a memory leak
// We must manually delete entries
const reactivePropMap: Map<ReactiveModel, Map<PropertyKey, ReactiveProp>> = new Map()
const KEY = 1
const MODEL = 0

// export type ReactiveProp = [ReactiveModel, PropertyKey]

export class ReactiveProp extends Array implements ReactivePrimitive {
    propMap: Map<PropertyKey, ReactiveProp>

    constructor(
        model: ReactiveModel,
        key: PropertyKey,
        propMap?: Map<PropertyKey, ReactiveProp>,
    ) {
        super();
        const _propMap = propMap || new Map()
        this.propMap = _propMap
        reactivePropMap.set(model, _propMap)
        this.push(model, key);
        _propMap.set(key, this)
    }

    destroy() {
        const propMap = this.propMap
        propMap.delete(this[KEY])
        if (propMap.size === 0) {
            reactivePropMap.delete(this[MODEL])
        }
    }

    asAtom?: ReactiveAtom | undefined;
    initializeAsAtom(atom: ReactiveAtom) {
        _initializeAsAtom.apply(this, [atom])
    }
    destroyAsAtom() {
        _destroyAsAtom.apply(this)
    }
}

export function isReactiveProp(value: any): value is ReactiveProp {
    if (!(value instanceof Object)) return false;
    return value instanceof ReactiveProp;
}

export function asReactiveProp(
    model: ReactiveModel,
    key: PropertyKey
): ReactiveProp {
    const propMap = reactivePropMap.get(model);
    if (!propMap) return new ReactiveProp(model, key) as unknown as ReactiveProp;
    const reactiveProp = propMap.get(key);
    if (!reactiveProp) return new ReactiveProp(model, key, propMap) as unknown as ReactiveProp;
    return reactiveProp as unknown as ReactiveProp
}

export function getReactiveProp(
    model: ReactiveModel,
    key: PropertyKey
): ReactiveProp | null {
    const propMap = reactivePropMap.get(model);
    if (!propMap) return null;
    const reactiveProp = propMap.get(key);
    if (!reactiveProp) return null;
    return reactiveProp as unknown as ReactiveProp
}

export function getReactivePropValue(prop: ReactiveProp) {
    const [target, key] = prop
    return target[key];
}