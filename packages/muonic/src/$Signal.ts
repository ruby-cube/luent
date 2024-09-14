import { emitSignal } from "./debug";
import { isDeepReactive, isReactiveModel, o$$, o$, ModelReactivityDepth } from "./reactivemodel/ReactiveModel";
import { getActiveTracker } from "./derivations/DependencyTracker";
import { trigger } from "./trigger";
import { META, ReactiveEntity } from "./ReactiveEntity";
import { sign } from "crypto";
import { isFunctionWithProps } from "@rue/utils";

export type AtomicSignal<T = any> = {
    (): T;
    [META]: MetaSignal<T>;
    setFrom: (toNewValue: (value: T) => T) => T
    setTo: (newValue: T) => T
}

export const SIGNAL = Symbol('signal');

export class MetaSignal<T = unknown> implements ReactiveEntity {

    type = SIGNAL

    constructor(
        readonly o: AtomicSignal<T>,
        public value: T,
        readonly depth?: ModelReactivityDepth
    ) { }
}


export function $Signal<T>(value: T) {
    let metaSignal: MetaSignal

    function $signal() {
        if (__DEV__) emitSignal();
        const tracker = getActiveTracker()
        if (!tracker) return metaSignal.value
        tracker.track($signal)
        return metaSignal.value;
    }

    // mark reactive depth of value if value is ReactiveModel
    const depth =
        value instanceof Object ?
            isDeepReactive(value) ? ModelReactivityDepth.DEEP
                : isReactiveModel(value) ? ModelReactivityDepth.SHALLOW
                    : undefined
            : undefined

    metaSignal = new MetaSignal($signal, value, depth)

    $signal[META] = metaSignal;
    $signal.setTo = setTo.bind(metaSignal);
    $signal.setFrom = setFrom.bind(metaSignal);

    return $signal as AtomicSignal<T>;
}


function setTo(this: MetaSignal, newValue: unknown) {
    const value = this.value;
    if (value === newValue) return value;
    return setValue(this, newValue);
}

function setFrom(this: MetaSignal, toNewValue: (value: unknown) => unknown) {
    const value = this.value;
    const newValue = toNewValue(value)
    if (value === newValue) return value;
    return setValue(this, newValue);
}

// ORDER:
// - set value
// - trigger effects (run sync effects, schedule effects)
// - trigger derivations effects (run sync effects, schedule effects)

function setValue(signal: MetaSignal, newValue: unknown) {
    const $signal = signal.o;
    const _newValue = maybeReactivizeValue(newValue, signal)
    signal.value = _newValue;
    trigger($signal);
    return _newValue;
}

function maybeReactivizeValue(newValue: unknown, signal: MetaSignal) {
    return newValue instanceof Object ?
        signal.depth === ModelReactivityDepth.DEEP ? o$$(newValue) :
            signal.depth === ModelReactivityDepth.SHALLOW ? o$(newValue) :
                newValue : newValue
}


export function isSignal<T>(maybeSignal: T): maybeSignal is T extends AtomicSignal ? T : never {
    if (isFunctionWithProps(maybeSignal)) return maybeSignal[META]?.type === SIGNAL;
    return false;
}

export function getMetaSignal<T>(signal: AtomicSignal<T>): MetaSignal<T> {
    return signal[META]
}