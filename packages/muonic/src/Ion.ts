import { emitSignal } from "./debug";
import { isDeepReactive, isReactiveModel, $Model, $Model, ModelReactivityDepth, $Deep } from "./reactivemodel/ReactiveModel";
import { getActiveTracker } from "./derivations/DependencyTracker";
import { trigger } from "./trigger";
import { META, ReactiveEntity } from "./ReactiveEntity";
import { isFunctionWithProps } from "@rue/utils";

export type AtomicSignal<T = any> = {
    (): T;
    [META]: MetaIon<T>;
    update: (toNewValue: (value: T) => T) => T
    setTo: (newValue: T) => T
}


export type AtomicIon<T = any> = {
    (): T;
    [META]: MetaIon<T>;
    update: (toNewValue: (value: T) => T) => T
    setTo: (newValue: T) => T
}

// export type ReactiveGet<T = any> = () => T
export type Get<T = any> = () => T



export const ATOMIC_ION = Symbol('atomicIon');

export class MetaIon<T = unknown> implements ReactiveEntity {

    type = ATOMIC_ION

    constructor(
        readonly o: AtomicIon<T>,
        public value: T,
        readonly depth?: ModelReactivityDepth
    ) { }
}


export function $State<T>(value: T) {
    let metaIon: MetaIon

    function $ion() {
        if (__DEV__) emitSignal();
        const tracker = getActiveTracker()
        if (!tracker) return metaIon.value
        tracker.track($ion)
        return metaIon.value;
    }

    // mark reactive depth of value if value is ReactiveModel
    const depth =
        value instanceof Object ?
            isDeepReactive(value) ? ModelReactivityDepth.DEEP
                : isReactiveModel(value) ? ModelReactivityDepth.SHALLOW
                    : undefined
            : undefined

    metaIon = new MetaIon($ion, value, depth)

    $ion[META] = metaIon;
    $ion.setTo = setTo.bind(metaIon);
    $ion.update = update.bind(metaIon);

    return $ion as AtomicIon<T>;
}


function setTo(this: MetaIon, newValue: unknown) {
    const value = this.value;
    return setValue(this, newValue, value);
}

function update(this: MetaIon, toNewValue: (value: unknown) => unknown) {
    const value = this.value;
    const newValue = toNewValue(value)
    return setValue(this, newValue, value);
}

// ORDER:
// - set value
// - trigger effects (run sync effects, schedule effects)
// - trigger derivations effects (run sync effects, schedule effects)

function setValue(metaIon: MetaIon, newValue: unknown, oldValue: unknown) {
    if (oldValue === newValue) return oldValue;
    const $ion = metaIon.o;
    const _newValue = maybeReactivizeValue(newValue, metaIon)
    metaIon.value = _newValue;
    trigger($ion);
    return _newValue;
}

function maybeReactivizeValue(newValue: unknown, metaIon: MetaIon) {
    return newValue instanceof Object ?
        metaIon.depth === ModelReactivityDepth.DEEP ? $Deep(newValue) :
            metaIon.depth === ModelReactivityDepth.SHALLOW ? $Model(newValue) :
                newValue : newValue
}


export function isIon<T>(maybeIon: T): maybeIon is T extends AtomicIon ? T : never {
    if (isFunctionWithProps(maybeIon)) return maybeIon[META]?.type === ATOMIC_ION;
    return false;
}

export function getMetaIon<T>($ion: AtomicIon<T>): MetaIon<T> {
    return $ion[META]
}