import { AnyObject, ReadonlyKeys } from "@rue/types";
import { asMetaIonizedModel, isIonizedModel, ionize, IonizedModel, toRaw } from "./ionize";
import { META } from "../ReactiveEntity";
import { isIon } from "../ion/Ion";
import { protectedMethod, reinIon, READONLY } from "../ion/ReinedIon";
import { isReinedIonizedModel, isRestricted } from "./ReinedIonizedModel";
import { rein } from "../rein";
import { __devCheckIfTracked, getActiveTracker } from "../derivations/DependencyTracker";
import { asWatchSubject, WatchSubject } from "../effects/WatchSubject";
import { asIonicAtom, IonicAtom } from "../derivations/IonicAtom";
import { asMetaIon } from "../ion/AtomicIon";
import { readonly } from "../readonly";



export function isPropIon(value: any): value is PropIon {
    return value?.[META] instanceof MetaPropIon;
}

export type PropIon<T = any, M = undefined> = M extends undefined ? {
    (): T
    // set: (newValue: T) => T
    [META]: MetaPropIon
} : M & {
    (): T
    // set: (newValue: T) => T
    [META]: MetaPropIon
}

type TransferredMethods<T, M> = {
    [K in keyof M]: M[K] extends true ? T[K extends keyof T ? K : never] : T[M[K] extends keyof T ? M[K] : never]
}

// export type ReadonlyPropIon<T = any, M = undefined> = M extends undefined ? {
//     (selected?: true): T
//     [META]: MetaPropIon
// } : M & {
//     (selected?: true): T
//     [META]: MetaPropIon
// }

export type PropIonCapsule<T = any, M extends AnyObject = AnyObject> = {
    (): T
    [META]: MetaPropIon
} & M


// type AsPropIon<T, K extends keyof T, M> = PropIon<T[K], M>

const entryKeyValidators: ((model: AnyObject, key: PropertyKey) => boolean)[] = [];

export function registerEntryKeyValidator(isEntryKey: (model: AnyObject, key: PropertyKey) => boolean) {
    entryKeyValidators.push(isEntryKey);
}


function isEntryKey(rawModel: AnyObject, key: PropertyKey) {
    for (const validator of entryKeyValidators) {
        const is = validator(rawModel, key)
        if (is) return true;
    }
    return false;
}

class MetaPropIon {

    asReadonly?: PropIon
    // asObservedProp!: ObservedProp

    //to fulfill MetaWritableIon interface
    asDefaultReined = undefined
    hasMethods = false;
    isEntryKey = false;

    constructor(
        public o: PropIon,
        public model: IonizedModel,
        public key: PropertyKey,
        public inert: boolean = false
    ) {
        asMetaIonizedModel(model).registerPropIon(key, o)
        this.isEntryKey = isEntryKey(toRaw(model), key)
    }

    asWatchSubject?: WatchSubject
    asAtom?: IonicAtom
    private isIndex: boolean = false

    watch() {
        if (this.asWatchSubject) return;
        const metaModel = asMetaIonizedModel(this.model)
        if (this.isEntryKey)
            metaModel.addObservedEntryKey(this.key);

        const watchSubject = this.asWatchSubject = asWatchSubject(this.o)

        watchSubject.onUnwatched(() => {
            if (watchSubject.watchCount === 0 && this.asAtom?.derivations.size === 0) {
                this.destroy()
            }
        })
    }

    track() {
        if (this.asAtom) return;

        const atom = this.asAtom = asIonicAtom(this.o)

        if (this.isEntryKey)
            asMetaIonizedModel(this.model).addObservedEntryKey(this.key)

        atom.onUntracked(() => {
            if (this.asWatchSubject?.watchCount === 0 && atom.derivations.size === 0) {
                this.destroy()
            }
        })
    }

    destroy() {
        const metaModel = asMetaIonizedModel(this.model)
        const key = this.key
        if (this.isEntryKey) metaModel.deleteObservedEntryKey(key)
        metaModel.unregisterPropIon(key)
    }
}

type AsPropIon<T extends AnyObject, K extends keyof T, M> = PropIon<T[K], M extends AnyObject ? { [K in keyof TransferredMethods<T, M>]: TransferredMethods<T, M>[K] } : undefined>

export function asPropIon<T extends AnyObject, K extends keyof T, M>(model: T, key: K, methods?: M & { [key: string]: keyof T | true }): AsPropIon<T, K, M> {
    const ionicModel = isIonizedModel(model) ? model : ionize(model) //TODO: is there a more performant solution than ionizing non-reactive models? like mapping model to prop ions?
    const rawTarget = toRaw(ionicModel)
    const value = rawTarget[key];

    // return absorbed ion
    if (isIon(value)) {
        if (methods && __DEV__) console.warn(`absorbed ions cannot have additional methods assigned to them`)
        if (isReinedIonizedModel(ionicModel))
            return reinIon(value, []);
        return value;
    }

    // return existing propIon
    const propIon = getPropIon(ionicModel, key) //TODO: need a map for readonly prop ions too...
    if (propIon && !methods) {
        if (isReinedIonizedModel(ionicModel)) {
            readonly(propIon)
        }
        return propIon as AsPropIon<T, K, M>
    }
    return createPropIon(ionicModel, key, methods) as AsPropIon<T, K, M>
}

export function getPropIon(
    ionicModel: IonizedModel,
    key: PropertyKey
) {
    return asMetaIonizedModel(ionicModel).getPropIon(key)
}

function createPropIon<T extends IonizedModel, K extends keyof T, M>(ionicModel: T, key: K, methods?: M & { [key: string]: PropertyKey | true }): PropIon<T[K], M> {
    const rawTarget = toRaw(ionicModel)


    function __$propIon() {
        reregisterIfNeeded()
        const tracker = getActiveTracker()
        if (tracker)
            return toRaw(ionicModel)[key]
        return ionicModel[key];
    }

    const proto = {
        [META]: new MetaPropIon(<PropIon>__$propIon, ionicModel, key),
        // set: (newValue: T[K]) => {
        //     reregisterIfNeeded()
        //     if (__DEV__) __devCheckIfTracked()
        //     return setValue(ionicModel, key, newValue, ionicModel[key])
        // }
    } as AnyObject


    if (methods) {
        for (const key in methods) {
            // if (key === 'as') {
            //     if (__DEV__) console.warn(`'as' is reserved for the native set method for ions. Choose different method name`)
            //     continue;
            // }

            const methodKey = methods[key] === true ? key : methods[key]
            proto[key] = ionicModel[methodKey] //TODO: 
            // .bind(proto) // This makes set function available to `this` even after protected //QUESTION: is this necessary if dev does not use this??
        }
    }

    Object.setPrototypeOf(__$propIon, proto)

    // __$propIon[META] = new MetaPropIon(<PropIon>__$propIon, ionicModel, key)
    // __$propIon.set = 

    function reregisterIfNeeded() {
        const metaIonicModel = asMetaIonizedModel(ionicModel);
        if (!metaIonicModel.getPropIon(key)) {
            if (__DEV__) console.warn(`[CASE RESEARCH] I'm curious how often and in what cases this happens: $propIon for ${key.toString()} in${JSON.stringify(rawTarget)} is no longer observed, but there's still an active reference to it`)
            metaIonicModel.registerPropIon(key, __$propIon as PropIon) // This means $propIon is not being watched and is not an atom anywhere, but it's still being used
        }
    }

    return __$propIon as PropIon<T[K], M>
    // return isReinedIonizedModel(ionicModel) ? reinIon(__$propIon as PropIon, READONLY) : __$propIon //FIX: isn't it already protected?
}

export function asTrackedProp(
    ionicModel: IonizedModel,
    key: PropertyKey
) {
    const prop = getPropIon(ionicModel, key) ?? createPropIon(ionicModel, key)
    const meta = asMetaIon(prop)
    meta.track()
    return prop;
}

export function asWatchedProp(
    ionicModel: IonizedModel,
    key: PropertyKey
) {
    const prop = getPropIon(ionicModel, key) ?? createPropIon(ionicModel, key)
    const meta = asMetaIon(prop)
    meta.watch()
    return prop;
}

export function getObservedProp( // observed means watched and/or tracked
    ionicModel: IonizedModel,
    key: PropertyKey
) {
    const prop = getPropIon(ionicModel, key);
    if (!prop) return undefined;
    const meta = asMetaIon(prop);
    if (meta.asWatchSubject || meta.asAtom) return prop;
    return undefined;
}


// function createObservedProp(
//     reactive: IonizedModel,
//     key: PropertyKey
// ) {
//     const metaIonicModel = asMetaIonizedModel(reactive);
//     const prop = new ObservedProp(metaIonicModel, key);


//     const isIndex = toRaw(metaIonicModel) instanceof Array && isIntegerKey(key)
//     if (isIndex) {
//         (<MetaIonicCollection>metaIonicModel).addObservedEntryKey(key);
//     }
//     const atom = asIonicAtom(prop)
//     const watchSubject = asWatchSubject(prop)

//     atom.onUntracked(unobserve)
//     watchSubject.onUnwatched(unobserve)

//     function unobserve() {
//         if (watchSubject.watchCount === 0 && atom.derivations.size === 0) {
//             if (isIndex) (<MetaIonicCollection>metaIonicModel).deleteObservedEntryKey(key)
//             prop.destroy()
//         }
//     }


//     return prop
// }


function setValue<T>(reactive: IonizedModel, key: PropertyKey, newValue: T, oldValue: T) {
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
function PropIon<T extends IonizedModel, K extends keyof T>(ionicModel: T, key: K, methods: {
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
        return rein(coreIon, READONLY)
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


