import { AnyObject, ReadonlyKeys } from "@rue/types";
import { asMetaIonicModel, isIonicModel, ionize, IonicModel, toRaw } from "./IonicModel";
import { asObservedProp, ObservedProp } from "./ObservedProp";
import { META } from "../ReactiveEntity";
import { isAnyIon } from "../ion/AnyIon";
import { protectIon } from "../ion/ProtectedIon";
import { isProtectedIonicModel } from "./ProtectedIonicModel";



export function isPropIon(value: any): value is PropIon {
    return value[META] instanceof MetaPropIon;
}

export type PropIon<T = any> = {
    (): T;
    set: (newValue: T) => T
    [META]: MetaPropIon
}

export type ReadonlyPropIon<T = any> = {
    (): T;
    [META]: MetaPropIon
}

type Protected = {
    readonly frog: string,
    fluffy: boolean
}




type AsPropIon<T, K extends keyof T> = K extends ReadonlyKeys<T> ? ReadonlyPropIon<T[K]> : PropIon<T[K]>


class MetaPropIon {

    asReadonly?: PropIon
    asObservedProp!: ObservedProp

    //to fulfill MetaWritableIon interface
    asProtected = undefined
    hasMethods = false;

    constructor(
        public o: PropIon,
        public model: IonicModel,
        public key: PropertyKey
    ) {
        const prop = this.asObservedProp = asObservedProp(model, key)
        const metaIonicModel = asMetaIonicModel(model);
        metaIonicModel.registerPropIon(key, o)
        prop.onDestroy(() => {
            metaIonicModel.unregisterPropIon(key)
        })
    }
}



export function asPropIon<T extends AnyObject, K extends keyof T>(model: T, key: K, methods?: AnyObject): AsPropIon<T, K> {
    const ionicModel = isIonicModel(model) ? model : ionize(model)
    const rawTarget = toRaw(ionicModel)
    const value = rawTarget[key];
    if (isAnyIon(value)) {
        if (isProtectedIonicModel(ionicModel))
            return protectIon(value);
        return value;
    }
    const propIon = asMetaIonicModel(ionicModel).getPropIon(key) //TODO: need a map for readonly prop ions too...
    if (propIon) return propIon as AsPropIon<T, K>
    return createPropIon(ionicModel, key, methods) as AsPropIon<T, K>
}

function createPropIon<T extends IonicModel, K extends keyof T, P extends T[K]>(ionicModel: T, key: K, methods: AnyObject | undefined): PropIon<P> {
    const rawTarget = toRaw(ionicModel)


    function __$propIon() {
        reregisterIfNeeded()
        return ionicModel[key];
    }

    __$propIon[META] = new MetaPropIon(<PropIon>__$propIon, ionicModel, key)
    __$propIon.set = (newValue: P) => {
        reregisterIfNeeded()
        return setValue(ionicModel, key, newValue, rawTarget[key])
    }

    if (methods){

    }

    function reregisterIfNeeded() {
        const metaIonicModel = asMetaIonicModel(ionicModel);
        if (!metaIonicModel.getPropIon(key)) {
            if (__DEV__) console.warn(`I'm curious how often and in what cases this happens: $propIon for ${key.toString()} in${JSON.stringify(rawTarget)} is no longer observed, but there's still an active reference to it`)
                metaIonicModel.registerPropIon(key, __$propIon) // This means $propIon is not being watched and is not an atom anywhere, but it's still being used
        }
    }

    return isProtectedIonicModel(ionicModel) ? protectIon(__$propIon, methodKeys): __$propIon
}

function setValue<T>(reactive: IonicModel, key: PropertyKey, newValue: T, oldValue: T) {
    if (oldValue === newValue) return oldValue;
    reactive[key] = newValue;
    return newValue;
}


