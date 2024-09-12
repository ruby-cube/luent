import { UNDEFINED } from "@rue/utils";
import { asReactiveAtom, ReactiveAtom } from "../derivations/ReactiveAtom";
import { asWatchTarget, WatchTarget } from "../effects/WatchTarget";
import { MetaReactiveModel } from "./ReactiveModel";
import { ReactiveModel, toRaw } from "./Reactive$";
import { META } from "../ReactiveEntity";
import { MetaReactiveCollection } from "./ReactiveCollection";
import { watch } from "fs";
import { isIntegerKey } from "./ReactiveArray";

// This module creates a unique tuple for reactive prop so that reactive props can be used as unique keys in maps

const observedPropMap: Map<ReactiveModel, Map<PropertyKey, ObservedProp>> = new Map()
// const KEY = '1'
// const MODEL = '0'

// export type ObservedProp = [ReactiveModel, PropertyKey]

export class ObservedProp {

    constructor(
        public reactive: ReactiveModel,
        public key: PropertyKey,
    ) {
        registerObservedProp(this, reactive, key)
        //TODO: destroy when watchCount === 0 && atom.derivations.size === 0
    }

    destroy() {
        unregisterObservedProp(this.reactive, this.key)
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

function getObservedProp(
    reactive: ReactiveModel,
    key: PropertyKey
) {
    return observedPropMap.get(reactive)?.get(key);
}

function createObservedProp(
    reactive: ReactiveModel,
    key: PropertyKey
) {
    const metaReactive = reactive[META];
    const prop = new ObservedProp(reactive, key);
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
    return prop.reactive[prop.key];
}


function registerObservedProp(prop: ObservedProp, reactive: ReactiveModel, key: PropertyKey,) {
    let propMap = observedPropMap.get(reactive)
    if (!propMap) {
        propMap = new Map()
        observedPropMap.set(reactive, propMap)
    }
    propMap.set(key, prop) // propMap should always exist because new ObservedProp is called after new Map() is called
}

function unregisterObservedProp(reactive: ReactiveModel, key: PropertyKey) {
    const propMap = observedPropMap.get(reactive)!
    if (__DEV__ && !propMap) throw new Error("No propMap :( this should never happen")
    propMap.delete(key)
    if (propMap.size === 0) {
        observedPropMap.delete(reactive)
    }
}