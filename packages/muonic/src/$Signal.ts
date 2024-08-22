import { storeInitialDerivedValueIfNeeded, track, trigger } from "./watch";
import { emitSignal } from "./hasReactivity_DEV";
import { isDeepReactive, isReactiveModel, ReactiveModel, DeepReactive$, Reactive$ } from "./Reactive$";
import { AnyObject } from "@rue/types";

export type Signal<T = any> = {
    (): T;
    [SIGNAL_MARKER]: boolean;
    set: (toNewValue: (value: T) => T) => T
}

export const SIGNAL_MARKER = Symbol('signal marker');

const signalValues: WeakMap<Signal, any> = new WeakMap();
const $$DepthSignals: WeakSet<Signal> = new WeakSet();
const $$$DepthSignals: WeakSet<Signal> = new WeakSet();



export function $Signal<T>(value?: T): Signal<T> {

    const signal = () => {
        if (__DEV__) emitSignal();
        const value = signalValues.get(signal)
        track(signal)
        return value;
    }

    // mark reactive depth of value
    if (value instanceof Object) {
        if (isDeepReactive(value)) {
            $$$DepthSignals.add(signal)
        }
        else if (isReactiveModel(value)) {
            $$DepthSignals.add(signal);
        }
    }

    signalValues.set(signal, value)
    signal[SIGNAL_MARKER] = true;
    signal.set = set;

    return signal;
}

function set<T>(this: Signal<T>, toNewValue: (value: T) => T) {
    if (!(SIGNAL_MARKER in this))
        throw new Error("[Invalid Input] `set` can only set type `Signal`")

    if (!signalValues.has(this))
        throw new Error("Signal not found :( This should never happen.")

    const value = signalValues.get(this);
    const newValue = toNewValue(value)

    if (value === newValue) return value;

    const _newValue = newValue instanceof Object ?
        $$$DepthSignals.has(this) ? DeepReactive$(newValue) :
            $$DepthSignals.has(this) ? Reactive$(newValue) :
                newValue : newValue

    const updateCycle = trigger(this, _newValue, value);
    storeInitialDerivedValueIfNeeded(updateCycle, this)

    signalValues.set(this, _newValue);

    return _newValue;
}


export function isSignal(maybeSignal: any): maybeSignal is Signal {
    if (maybeSignal instanceof Function) return SIGNAL_MARKER in maybeSignal;
    return false;
}



