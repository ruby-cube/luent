import { emitSignal } from "./debug";
import { isDeepReactive, isReactiveModel, DeepReactive$, Reactive$, ReactiveModelDepth } from "./reactivemodel/Reactive$";
import { getActiveTracker } from "./derivations/DependencyTracker";
import { trigger } from "./trigger";
import { META, ReactiveEntity } from "./ReactiveEntity";

export type AtomicSignal<T = any> = {
    (): T;
    [META]: MetaSignal<T>;
    setFrom: (toNewValue: (value: T) => T) => T
    setTo: (newValue: T) => T
}

export const SIGNAL = Symbol('signal');

export class MetaSignal<T = unknown> implements  ReactiveEntity {

    type = SIGNAL

    constructor(
        readonly o: AtomicSignal<T>,
        public value: T,
        readonly depth?: ReactiveModelDepth
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
            isDeepReactive(value) ? ReactiveModelDepth.DEEP
                : isReactiveModel(value) ? ReactiveModelDepth.SHALLOW
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
        signal.depth === ReactiveModelDepth.DEEP ? DeepReactive$(newValue) :
            signal.depth === ReactiveModelDepth.SHALLOW ? Reactive$(newValue) :
                newValue : newValue
}


export function isAtomicSignal(maybeSignal: any): maybeSignal is AtomicSignal {
    if (maybeSignal instanceof Function) return maybeSignal[META]?.type === SIGNAL;
    return false;
}