import { AnyObject } from "@rue/types";

export type Signal<T = any> = { (): T;[SignalMarker]: boolean; }
const SignalMarker = Symbol();
let _hasSignal = false;

export function useSignalKit() {
    const signalValues: WeakMap<Signal, any> = new WeakMap();

    return {
        signalize<T>(value: T): Signal<T> {  //TODO: add track
            const signal = () => {
                _hasSignal = true;
                return signalValues.get(signal)
            }
            signalValues.set(signal, value)
            signal[SignalMarker] = true;
            return signal;
        },

        set<T>(signal: Signal<T>, genNewValue: (value: T) => T) {
            if (!signalValues.has(signal)) throw "`set` can only set local signals created with corresponding `signalize` function"
            const value = signal();
            const newValue = genNewValue(value)
            signalValues.set(signal, newValue)  //TODO: add trigger
            return newValue;
        }
    }
}

export function isSignal(maybeSignal: AnyObject): maybeSignal is Signal {
    return SignalMarker in maybeSignal;
}

export function isDerivedSignal(maybeSignal: () => any): boolean { //TODO: what about accessing reactive properties?
    maybeSignal();
    if (_hasSignal) {
        _hasSignal = false;
        return true;
    }
    return false;
}



const { signalize, set } = useSignalKit();

const $frog = signalize({
    name: "kermit"
})

set($frog, () => ({ name: "robin" }))