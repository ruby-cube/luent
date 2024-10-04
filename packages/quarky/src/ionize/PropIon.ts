import { AnyObject, ReadonlyKeys } from "@rue/types";
import { asMetaIonicModel, isIonicModel, ionize, IonicModel, toRaw } from "./IonicModel";
import { asObservedProp, ObservedProp } from "./ObservedProp";
import { META } from "../ReactiveEntity";
import { isAnyIon } from "../ion/AnyIon";
import { protectedMethod, protectIon, READONLY } from "../ion/ProtectedIon";
import { isProtectedIonicModel } from "./ProtectedIonicModel";
import { protect } from "../protect";
import { __devCheckIfTracked } from "../derivations/DependencyTracker";



export function isPropIon(value: any): value is PropIon {
    return value?.[META] instanceof MetaPropIon;
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

export type PropIonCapsule<T = any, M extends AnyObject = AnyObject> = {
    (): T;
    [META]: MetaPropIon
} & M


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



export function asPropIon<T extends AnyObject, K extends keyof T>(model: T, key: K, readonly?: typeof READONLY): AsPropIon<T, K> {
    const ionicModel = isIonicModel(model) ? model : ionize(model)
    const rawTarget = toRaw(ionicModel)
    const value = rawTarget[key];

    // return absorbed ion
    if (isAnyIon(value)) {
        if (isProtectedIonicModel(ionicModel))
            return protectIon(value);
        return value;
    }

    // return existing propIon
    const propIon = asMetaIonicModel(ionicModel).getPropIon(key) //TODO: need a map for readonly prop ions too...
    if (propIon) {
        if (isProtectedIonicModel(ionicModel) || readonly) {
            protect(propIon, READONLY)
        }
        return propIon as AsPropIon<T, K>
    }
    return createPropIon(ionicModel, key, readonly) as AsPropIon<T, K>
}

function createPropIon<T extends IonicModel, K extends keyof T>(ionicModel: T, key: K, readonly?: typeof READONLY): PropIon<T[K]> {
    const rawTarget = toRaw(ionicModel)


    function __$propIon() {
        reregisterIfNeeded()
        return ionicModel[key];
    }

    __$propIon[META] = new MetaPropIon(<PropIon>__$propIon, ionicModel, key)
    __$propIon.set = (newValue: T[K]) => {
        reregisterIfNeeded()
        if (__DEV__) __devCheckIfTracked()
        return setValue(ionicModel, key, newValue, ionicModel[key])
    }

    function reregisterIfNeeded() {
        const metaIonicModel = asMetaIonicModel(ionicModel);
        if (!metaIonicModel.getPropIon(key)) {
            if (__DEV__) console.warn(`[CASE RESEARCH] I'm curious how often and in what cases this happens: $propIon for ${key.toString()} in${JSON.stringify(rawTarget)} is no longer observed, but there's still an active reference to it`)
            metaIonicModel.registerPropIon(key, __$propIon) // This means $propIon is not being watched and is not an atom anywhere, but it's still being used
        }
    }

    return isProtectedIonicModel(ionicModel) || readonly ? protectIon(__$propIon, READONLY) : __$propIon
}

function setValue<T>(reactive: IonicModel, key: PropertyKey, newValue: T, oldValue: T) {
    if (oldValue === newValue) return oldValue;
    reactive[key] = newValue;
    return newValue;
}


const PROP_ION_CAPSULE = Symbol('propIonWithMethods')
/**
 * Creates a prop ion capsule--a prop ion encapsulated with methods.  
 * 
 * @example
 * ```js
 * const count = PropIon($product, 'count', {
 *   increment: $product.incrementCount,
 *   decrement: $product.decrementCount,
 * })
 * ```
*/
function PropIon<T extends IonicModel, K extends keyof T>(ionicModel: T, key: K, methods: {
    [key: string]: (...args: any[]) => any
}) {
    const coreIon = asPropIon(ionicModel, key)
    function $propIonCapsule() {
        return coreIon()
    }

    $propIonCapsule[META] = coreIon[META]
    $propIonCapsule[PROP_ION_CAPSULE] = true
    Object.setPrototypeOf($propIonCapsule, methods)

    return $propIonCapsule;
}

export function protectPropIonCapsule($ion: PropIon, methodKeys?: { [key: string]: true } | typeof READONLY) {
    if (methodKeys === READONLY) {
        const coreIon = $ion[META].o
        return protect(coreIon, READONLY)
    }
    if (methodKeys) {
        return createCustomProtectedPropIonCapsule($ion, methodKeys)
    }
    return $ion; // since prop ion capsule are inherently protected, return original
}

function createCustomProtectedPropIonCapsule($ion: PropIon, methodKeys: { [key: string]: true }) {
    const coreIon = $ion[META].o
    const methods = Object.getPrototypeOf($ion)
    function $customProtected() {
        return coreIon();
    }
    $customProtected[META] = coreIon[META]
    $customProtected[PROP_ION_CAPSULE] = true
    for (const key in methods) {
        if (!(key in methodKeys)) {
            (<AnyObject>$customProtected)[key] = protectedMethod
        }
    }
    Object.setPrototypeOf($customProtected, methods)
    return $customProtected
}


