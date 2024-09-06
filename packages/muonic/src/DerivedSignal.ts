import { isSignal, Signal, SIGNAL_MARKER } from "./$Signal";
import { READONLY_SIGNAL } from "./asReadonly";
import { getDependencyTracker } from "./DependencyTracker";
import { ReactiveDerivation } from "./ReactiveDerivation";

// The $ function has various purposes
// - it marks a function as a reactive getter so that it can be distinguished from normal functions
// - it tracks the value of a derived signal and memoizes if needed
// - visually groups an arrow function getter and visually marks reactivity
// Signals created from $ function are not necessarily derived. They may be simple reactive getters, but for simplicity of code, they are all called derived signals and given derived signal props
// Note that siganl with only one dependency could still be a derived signal.


export const DERIVED_SIGNAL = Symbol('derived signal')

export type DerivedSignal<T = any> = {
    (): T
    [DERIVED_SIGNAL]: DerivedSignalState
}

export type ReactiveSignal<T = any> = DerivedSignal<T> | Signal<T>;

export function isDerivedSignal(maybeDerivedSignal: any): maybeDerivedSignal is DerivedSignal {
    if (!(maybeDerivedSignal instanceof Function)) return false
    return DERIVED_SIGNAL in maybeDerivedSignal;
}


export function hasSignal(maybeSignal: any): maybeSignal is DerivedSignal | Signal {
    if (!(maybeSignal instanceof Function)) return false;
    if (SIGNAL_MARKER in maybeSignal || DERIVED_SIGNAL in maybeSignal || READONLY_SIGNAL in maybeSignal) return true;
    return false;
}

class DerivedSignalState<T extends DerivedSignal = DerivedSignal> extends ReactiveDerivation<T> {
    value: any;

    constructor(derivedSignal: T, retrack: boolean) {
        super(derivedSignal, retrack);
    }

    updateValue(value: any) {
        this.value = value;
    }
}


export function $<T extends any>(pureGetter: () => T, retrack: boolean = false): DerivedSignal<T> {
    let initialized = false;
    const signal = new DerivedSignalState(<DerivedSignal><unknown>$derivedSignal, retrack);
    (<DerivedSignal><unknown>$derivedSignal)[DERIVED_SIGNAL] = signal;
    function $derivedSignal() {
        if (!initialized || signal.dirty && retrack) {
            const value = signal.trackDependencies(pureGetter);
            signal.forwardDependencies(signal.dependencies)
            signal.updateValue(value)
            signal.undirty()
            initialized = true;
            return value;
        }
        
        if (signal.dirty) {
            signal.forwardDependencies(signal.dependencies)
            const newValue = pureGetter();
            signal.updateValue(newValue)
            signal.undirty()
            return newValue;
        }

        signal.forwardDependencies(signal.dependencies)

        return signal.value; // memoized value
    }

    return <DerivedSignal><unknown>$derivedSignal;
}
