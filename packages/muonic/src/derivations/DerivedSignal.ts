import { isSignal, AtomicSignal } from "../Signal";
import { READONLY_SIGNAL } from "../asReadonly";
import { ReactiveDerivation } from "./ReactiveDerivation";
import { onDestroy } from "../../../lumo/src/dynamic/lifecycle";
import { META, ReactiveEntity } from "../ReactiveEntity";
import { isPropSignal } from "../reactivemodel/PropSignal";

// The $ function has various purposes
// - it marks a function as a reactive getter so that it can be distinguished from normal functions
// - it tracks the value of a derived signal and memoizes if needed
// - visually groups an arrow function getter and visually marks reactivity
// Signals created from $ function are not necessarily derived. They may be simple reactive getters, but for simplicity of code, they are all called derived signals and given derived signal props
// Note that siganl with only one dependency could still be a derived signal.


export const DERIVED_SIGNAL = Symbol('derivedSignal')

export type DerivedSignal<T = any> = {
    (): T
    [META]: MetaDerivedSignal
    untrack: () => void
}

export type AnySignal<T = any> = DerivedSignal<T> | AtomicSignal<T>;

export function isDerivedSignal(maybeDerivedSignal: any): maybeDerivedSignal is DerivedSignal {
    if (!(maybeDerivedSignal instanceof Function)) return false
    return maybeDerivedSignal[META]?.type === DERIVED_SIGNAL;
}


export function isAnySignal(maybeSignal: any): maybeSignal is DerivedSignal | AtomicSignal {
    if (!(maybeSignal instanceof Function)) return false;
    if (isSignal(maybeSignal) || isDerivedSignal(maybeSignal) || READONLY_SIGNAL in maybeSignal || isPropSignal(maybeSignal)) return true;
    return false;
}

class MetaDerivedSignal<T extends DerivedSignal = DerivedSignal> extends ReactiveDerivation {

    override type = DERIVED_SIGNAL

    constructor(override readonly o: T, retrack: boolean) {
        super(o, DERIVED_SIGNAL, retrack);
    }

    value: any;

    updateValue(value: any) {
        this.value = value;
    }
}


export function $<T extends any>(pureGetter: () => T, retrack: boolean = false): DerivedSignal<T> {
    let initialized = false;
    const derived = new MetaDerivedSignal(<DerivedSignal><unknown>$derivedSignal, retrack);
    function $derivedSignal() {
        if (!initialized || derived.dirty && retrack) {
            const value = derived.trackAtoms(pureGetter);
            derived.forwardAtoms(derived.atoms)
            derived.updateValue(value)
            derived.undirty()
            initialized = true;
            return value;
        }

        if (derived.dirty) {
            const newValue = pureGetter();
            derived.forwardAtoms(derived.atoms)
            derived.updateValue(newValue)
            derived.undirty()
            return newValue;
        }

        derived.forwardAtoms(derived.atoms)

        return derived.value; // memoized value
    }
    $derivedSignal[META] = derived;
    $derivedSignal.untrack = () => {
        derived.untrackAtoms()
    }
    onDestroy(() => {
        derived.untrackAtoms()
    })

    return <DerivedSignal><unknown>$derivedSignal;
}
