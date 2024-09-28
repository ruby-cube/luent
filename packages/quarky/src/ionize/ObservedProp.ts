import { asIonicAtom, IonicAtom } from "../derivations/IonicAtom";
import { asWatchTarget, WatchTarget } from "../effects/WatchTarget";
import { asMetaIonicModel, IonicModel, toRaw } from "./IonicModel";
import { isIntegerKey } from "./IonicArray";
import { MetaIonicCollection, MetaIonicModel } from "./MetaIonicModel";
import { PropIon } from "./PropIon";

// This module creates a unique tuple for reactive prop so that reactive props can be used as unique keys in maps

// const observedPropMap: Map<MetaIonicModel, Map<PropertyKey, ObservedProp>> = new Map()
// const KEY = '1'
// const MODEL = '0'

// export type ObservedProp = [IonicModel, PropertyKey]

export class ObservedProp {

    constructor(
        public metaIonicModel: MetaIonicModel, // because reactives can be deep or shallow, must map to metaIonicModel instead of reactive
        public key: PropertyKey,
    ) {
        metaIonicModel.registerObservedProp(key, this)
    }

    cleanUp?: () => void

    onDestroy(cleanUp: () => void) {
        if (__DEV__ && this.cleanUp) {
            console.error('Overriding existing cleanup function. This may mean we need an array for onDestroy tasks')
        }
        this.cleanUp = cleanUp
    }

    destroy() {
        this.metaIonicModel.unregisterObservedProp(this.key)
        this.cleanUp?.()
    }

    getValue() {
        return this.metaIonicModel.rawTarget[this.key];
    }
}

export function isObservedProp(value: any): value is ObservedProp {
    if (!(value instanceof Object)) return false;
    return value instanceof ObservedProp;
}

export function asObservedProp(
    reactive: IonicModel,
    key: PropertyKey
): ObservedProp {
    const observedProp = getObservedProp(reactive, key)
    if (observedProp) return observedProp
    return createObservedProp(reactive, key);
}

export function getObservedProp(
    reactive: IonicModel,
    key: PropertyKey
) {
    return asMetaIonicModel(reactive).getObservedProp(key)
}

function createObservedProp(
    reactive: IonicModel,
    key: PropertyKey
) {
    const metaIonicModel = asMetaIonicModel(reactive);
    const prop = new ObservedProp(metaIonicModel, key);
    const isIndex = toRaw(metaIonicModel) instanceof Array && isIntegerKey(key)
    if (isIndex) {
        (<MetaIonicCollection>metaIonicModel).addObservedEntryKey(key);
    }
    const atom = asIonicAtom(prop)
    const watchTarget = asWatchTarget(prop)

    atom.onUntracked(unobserve)
    watchTarget.onUnwatched(unobserve)

    function unobserve() {
        if (watchTarget.watchCount === 0 && atom.derivations.size === 0) {
            if (isIndex) (<MetaIonicCollection>metaIonicModel).deleteObservedEntryKey(key)
            prop.destroy()
        }
    }
    return prop
}


// export function getObservedPropValue(prop: ObservedProp) {
//     return prop.metaIonicModel.rawTarget[prop.key];
// }


// function registerObservedProp(prop: ObservedProp, metaIonicModel: MetaIonicModel, key: PropertyKey,) {
//     let propMap = observedPropMap.get(metaIonicModel)
//     if (!propMap) {
//         propMap = new Map()
//         observedPropMap.set(metaIonicModel, propMap)
//     }
//     propMap.set(key, prop) // propMap should always exist because new ObservedProp is called after new Map() is called
// }

// function unregisterObservedProp(metaIonicModel: MetaIonicModel, key: PropertyKey) {
//     const propMap = observedPropMap.get(metaIonicModel)!
//     if (__DEV__ && !propMap) throw new Error("No propMap :( this should never happen")
//     propMap.delete(key)
//     if (propMap.size === 0) {
//         observedPropMap.delete(metaIonicModel)
//     }
// }
export function toPropIon(value: any): PropIon | undefined {
    if (!(value instanceof ObservedProp)) return undefined;
    return value.metaIonicModel.getPropIon(value.key)
}