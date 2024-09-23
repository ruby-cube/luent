import { emitSignal } from "../debug";
import { isIonicModel, ionize } from "../ionize/IonicModel";
import { getActiveTracker } from "../derivations/DependencyTracker";
import { trigger } from "../trigger";
import { META, ReactiveEntity } from "../ReactiveEntity";
import { isFunctionWithProps } from "@rue/utils";
import { AnyObject } from "@rue/types";


export type AtomicIon<T = any> = {
    (): T;
    [META]: MetaIon<T>;
    setTo: (newValue: T) => T
    set: (toNewValue: (value: T) => T) => T
}

// export type ReactiveGet<T = any> = () => T
export type Get<T = any> = () => T



export const ATOMIC_ION = Symbol('atomicIon');

export class MetaIon<T = unknown> implements ReactiveEntity {

    type = ATOMIC_ION

    constructor(
        readonly o: AtomicIon<T>,
        public value: T,
        readonly hasIonicValue: boolean = false
    ) { }
}


export function AtomicIon<T>(value: T) {
    let metaIon: MetaIon

    function $ion() {
        if (__DEV__) emitSignal();
        const tracker = getActiveTracker()
        if (!tracker) return metaIon.value
        tracker.track($ion)
        return metaIon.value;
    }

    metaIon = new MetaIon($ion, value, isIonicModel(value))

    $ion[META] = metaIon;
    $ion.setTo = setTo.bind(metaIon);
    $ion.set = set.bind(metaIon);

    return $ion as AtomicIon<T>;
}


function setTo<T>(this: MetaIon, newValue: T) {
    return setValue(this, newValue, this.value);
}

function set<T>(this: MetaIon, toNewValue: (value: T) => T) {
    const value = this.value as T;
    return setValue(this, toNewValue(value), value);
}

// ORDER:
// - set value
// - trigger effects (run sync effects, schedule effects)
// - trigger derivations effects (run sync effects, schedule effects)

function setValue(metaIon: MetaIon, newValue: unknown, oldValue: unknown) {
    if (oldValue === newValue) return oldValue;
    const $ion = metaIon.o;
    const _newValue = shouldMakeIonic(newValue, metaIon) ? ionize(newValue) : newValue
    // toIonicModelIfMust(newValue, metaIon)
    metaIon.value = _newValue;
    trigger($ion);
    return _newValue;
}

function shouldMakeIonic(newValue: unknown, metaIon: MetaIon): newValue is AnyObject {
    return newValue instanceof Object && metaIon.hasIonicValue;
}


export function isIon<T>(maybeIon: T): maybeIon is T extends AtomicIon ? T : never {
    if (isFunctionWithProps(maybeIon)) return maybeIon[META]?.type === ATOMIC_ION;
    return false;
}

export function getMetaIon<T>($ion: AtomicIon<T>): MetaIon<T> {
    return $ion[META]
}