import { AnyObject } from "@rue/types";
import { track, trigger } from "./watch";
import { emitSignal } from "./useReactivity";

export type Signal<T = any> = { (): T;[SIGNAL_MARKER]: boolean; }
export const SIGNAL_MARKER = Symbol();
export const SetKey = Symbol();


// export function useSignalize() {
const signalValues: WeakMap<Signal, any> = new WeakMap();

export function set<T>(signal: Signal<T>, genNewValue: (value: T) => T) {
    if (!signalValues.has(signal)) throw new Error("Signal not registered")
    const value = signal();
    const newValue = genNewValue(value)
    if (value === newValue) return value;
    trigger(signal, newValue, value);
    signalValues.set(signal, newValue);
    return newValue;
}

// return {
export function signalize<T>(value: T): Signal<T> {  //TODO: add track
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
// set
// }
// }

export function isSignal(maybeSignal: any): maybeSignal is Signal {
    if (maybeSignal instanceof Function) return SIGNAL_MARKER in maybeSignal;
    return false;
}



