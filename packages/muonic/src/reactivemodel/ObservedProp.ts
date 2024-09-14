import { asReactiveAtom, ReactiveAtom } from "../derivations/ReactiveAtom";
import { asWatchTarget, WatchTarget } from "../effects/WatchTarget";
import { getMetaReactive, ReactiveModel, toRaw } from "./ReactiveModel";
import { META } from "../ReactiveEntity";
import { watch } from "fs";
import { isIntegerKey } from "./ReactiveArray";
import { MetaReactiveCollection, MetaReactiveModel } from "./MetaReactiveModel";

// This module creates a unique tuple for reactive prop so that reactive props can be used as unique keys in maps

const observedPropMap: Map<MetaReactiveModel, Map<PropertyKey, ObservedProp>> = new Map()
// const KEY = '1'
// const MODEL = '0'

// export type ObservedProp = [ReactiveModel, PropertyKey]

export class ObservedProp {

    constructor(
        public metaReactive: MetaReactiveModel,
        public key: PropertyKey,
    ) {
        registerObservedProp(this, metaReactive, key)
        //TODO: destroy when watchCount === 0 && atom.derivations.size === 0
    }

    destroy() {
        unregisterObservedProp(this.metaReactive, this.key)
    }
}

export function isObservedProp(value: any): value is ObservedProp {
    if (!(value instanceof Object)) return false;
    return value instanceof ObservedProp;
}

export function asObservedProp(
    reactive: ReactiveModel,
    key: PropertyKey
): ObservedProp {
    const observedProp = getObservedProp(reactive, key)
    if (observedProp) return observedProp
    return createObservedProp(reactive, key);
}

export function getObservedProp(
    reactive: ReactiveModel,
    key: PropertyKey
) {
    return observedPropMap.get(getMetaReactive(reactive))?.get(key);
}

function createObservedProp(
    reactive: ReactiveModel,
    key: PropertyKey
) {
    const metaReactive = getMetaReactive(reactive);
    const prop = new ObservedProp(metaReactive, key);
    const isIndex = toRaw(metaReactive) instanceof Array && isIntegerKey(key)
    if (isIndex) {
        (<MetaReactiveCollection>metaReactive).addObservedEntryKey(key);
    }
    const atom = asReactiveAtom(prop)
    const watchTarget = asWatchTarget(prop)

    atom.onUntracked(unobserve)
    watchTarget.onUnwatched(unobserve)

    function unobserve(){
        if (watchTarget.watchCount === 0 && atom.derivations.size === 0) {
            if (isIndex) (<MetaReactiveCollection>metaReactive).deleteObservedEntryKey(key)
            prop.destroy()
        }
    }
    return prop
}


export function getObservedPropValue(prop: ObservedProp) {
    return prop.metaReactive.rawTarget[prop.key];
}


function registerObservedProp(prop: ObservedProp, metaReactive: MetaReactiveModel, key: PropertyKey,) {
    let propMap = observedPropMap.get(metaReactive)
    if (!propMap) {
        propMap = new Map()
        observedPropMap.set(metaReactive, propMap)
    }
    propMap.set(key, prop) // propMap should always exist because new ObservedProp is called after new Map() is called
}

function unregisterObservedProp(metaReactive: MetaReactiveModel, key: PropertyKey) {
    const propMap = observedPropMap.get(metaReactive)!
    if (__DEV__ && !propMap) throw new Error("No propMap :( this should never happen")
    propMap.delete(key)
    if (propMap.size === 0) {
        observedPropMap.delete(metaReactive)
    }
}