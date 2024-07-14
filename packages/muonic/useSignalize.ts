import { AnyObject } from "@rue/types";
import { track, trigger } from "./watch";
import { emitSignal } from "./useReactivity";
import { DerivedSignal, makeDerivedSignal } from "./useDerivedSignal";

export type Signal<T = any> = { (): T;[SIGNAL_MARKER]: boolean; }
export const SIGNAL_MARKER = Symbol();
export const SetKey = Symbol();


export function useSignalize() {
    const signalValues: WeakMap<Signal, any> = new WeakMap();

    function set<T>(signal: Signal<T>, genNewValue: (value: T) => T) {
        if (!(SIGNAL_MARKER in signal))
            throw new Error("[Invalid Input] `set` can only set type `Signal`")
        if (!signalValues.has(signal))
            throw new Error("Signal must be set by its corresponding locally instantiated set function")
        const value = signal();
        const newValue = genNewValue(value)
        if (value === newValue) return value;
        trigger(signal, newValue, value);
        signalValues.set(signal, newValue);
        return newValue;
    }

    function signalize<T>(value: T): Signal<T> {
        const signal = () => {
            emitSignal();
            const value = signalValues.get(signal)
            track(value, signal)
            return value;
        }
        signalValues.set(signal, value)
        signal[SIGNAL_MARKER] = true;
        signal[SetKey] = set;
        return signal;
    }

    function $<T>(pureGetter: () => T, memoize?: "memoize"): DerivedSignal<T>
    function $<T>(value: T): Signal<T>
    function $<T>(valueOrPureGetter: T | (() => T), memoize?: "memoize"): Signal<T> | DerivedSignal<T> {
        if (valueOrPureGetter instanceof Function) {
            return makeDerivedSignal(valueOrPureGetter, memoize)
        }
        return signalize(valueOrPureGetter)
    }

    return {
        $,
        set
    }
}


export function isSignal(maybeSignal: any): maybeSignal is Signal {
    if (maybeSignal instanceof Function) return SIGNAL_MARKER in maybeSignal;
    return false;
}



