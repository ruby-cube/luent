import { isAtomicSignal, AtomicSignal, SIGNAL_MARKER } from "../$Signal";
import { READONLY_SIGNAL } from "../asReadonly";
import { useUpdateCycle } from "../effects/UpdateCycle";
import { isWatched } from "../effects/watch";
import { getDependencyTracker, getWithoutTracking } from "./DependencyTracker";
import { AS_DERIVATION, ReactiveDerivation } from "./ReactiveDerivation";

// The $ function has various purposes
// - it marks a function as a reactive getter so that it can be distinguished from normal functions
// - it tracks the value of a derived signal and memoizes if needed
// - visually groups an arrow function getter and visually marks reactivity
// Signals created from $ function are not necessarily derived. They may be simple reactive getters, but for simplicity of code, they are all called derived signals and given derived signal props
// Note that siganl with only one dependency could still be a derived signal.


export const DERIVED_SIGNAL = Symbol('derived signal')

export type DerivedSignal<T = any> = {
    (): T
    [DERIVED_SIGNAL]: true
    [AS_DERIVATION]: DerivedSignalState
    destroy: ()=>void
}

export type ReactiveSignal<T = any> = DerivedSignal<T> | AtomicSignal<T>;

export function isDerivedSignal(maybeDerivedSignal: any): maybeDerivedSignal is DerivedSignal {
    if (!(maybeDerivedSignal instanceof Function)) return false
    return DERIVED_SIGNAL in maybeDerivedSignal;
}


export function isSignal(maybeSignal: any): maybeSignal is DerivedSignal | AtomicSignal {
    if (!(maybeSignal instanceof Function)) return false;
    if (SIGNAL_MARKER in maybeSignal || DERIVED_SIGNAL in maybeSignal || READONLY_SIGNAL in maybeSignal) return true;
    return false;
}

class DerivedSignalState<T extends DerivedSignal = DerivedSignal> extends ReactiveDerivation {
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
            const newValue = pureGetter();
            signal.forwardDependencies(signal.dependencies)
            signal.updateValue(newValue)
            signal.undirty()
            return newValue;
        }

        signal.forwardDependencies(signal.dependencies)

        return signal.value; // memoized value
    }
    $derivedSignal.destroy = ()=>{
        signal.untrackDependencies()
    }

    return <DerivedSignal><unknown>$derivedSignal;
}
