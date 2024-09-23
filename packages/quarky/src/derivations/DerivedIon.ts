import { isIon, AtomicIon } from "../ion/AtomicIon";
import { READONLY_ION } from "../asReadonly";
import { IonicDerivation } from "./IonicDerivation";
import { onDestroy } from "../../../lumo/src/dynamic/lifecycle";
import { META } from "../ReactiveEntity";
import { isPropIon } from "../ionize/PropIon";
import { __devCheckIfTracked } from "./DependencyTracker";

// The $ function has various purposes
// - it marks a function as a reactive getter so that it can be distinguished from normal functions
// - it tracks the value of a derived signal and memoizes if needed
// - visually groups an arrow function getter and visually marks reactivity
// Signals created from $ function are not necessarily derived. They may be simple reactive getters, but for simplicity of code, they are all called derived signals and given derived signal props
// Note that siganl with only one dependency could still be a derived signal.


export const DERIVED_ION = Symbol('derivedIon')

export type DerivedIon<T = any> = {
    (): T
    [META]: MetaDerivedIon
    untrack: () => void
}

export type ReactiveGet<T = any> = DerivedIon<T> | AtomicIon<T> | (() => T);

export function isDerivedIon(maybeDerivedIon: any): maybeDerivedIon is DerivedIon {
    if (!(maybeDerivedIon instanceof Function)) return false
    return maybeDerivedIon[META]?.type === DERIVED_ION;
}




class MetaDerivedIon<T extends DerivedIon = DerivedIon> extends IonicDerivation {

    override type = DERIVED_ION

    constructor(override readonly o: T, retrack: boolean) {
        super(o, DERIVED_ION, retrack);
    }

    value: any;

    updateValue(value: any) {
        this.value = value;
    }
}

export const $ = DerivedIon


export function DerivedIon<T extends any>(pureGetter: () => T, retrack: boolean = true): DerivedIon<T> {
    let initialized = false;
    const derived = new MetaDerivedIon(<DerivedIon><unknown>DerivedIonIon, retrack);
    function DerivedIonIon() {
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
    DerivedIonIon[META] = derived;
    DerivedIonIon.untrack = () => {
        derived.untrackAtoms()
    }
    onDestroy(() => {
        derived.untrackAtoms()
    })

    return <DerivedIon><unknown>DerivedIonIon;
}



export type WritableDerivedIon<T = any> = {
    setTo: (newValue: T) => T;
    set: (toNewValue: (value: T) => T) => T
} & DerivedIon<T>


export function WritableDerivedIon<T>(config: { get: () => T, set: (value: T) => T }) {
    const writable = DerivedIon(config.get) as WritableDerivedIon<T>;
    const set = config.set;
    writable.setTo = set
    writable.set = (toNewValue) => {
        if (__DEV__) __devCheckIfTracked()
        return set(toNewValue(writable()));
    }
    return writable;
}