import { isIon, ReactiveIon } from "../ion/ReactiveIon";
import { IonicDerivation } from "./IonicDerivation";
import { onDestroy } from "../../../lumo/src/dynamic/lifecycle";
import { META } from "../ReactiveEntity";
import { __devCheckIfTracked } from "./DependencyTracker";
import { AnyObject } from "@rue/types";
import { ProtectedIon } from "../ion/ProtectedIon";

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

export type ReactiveGet<T = any> = DerivedIon<T> | ReactiveIon<T> | (() => T);

export function isDerivedIon(maybeDerivedIon: any): maybeDerivedIon is DerivedIon {
    return maybeDerivedIon[META]?.type === DERIVED_ION;
}




export class MetaDerivedIon extends IonicDerivation {

    override type = DERIVED_ION
    asProtected?: ProtectedIon
    asReadonly?: ProtectedIon

    constructor(
        override readonly o: DerivedIon, 
        retrack: boolean,
        public hasMethods: boolean = false
    ) {
        super(o, DERIVED_ION, retrack);
    }

    value: any;

    updateValue(value: any) {
        this.value = value;
    }
}


// export const $ = DerivedIon


export function DerivedIon<T extends any>(pureGetter: () => T, methods?: AnyObject, retrack: boolean = true): DerivedIon<T> {
    let initialized = false;
    const derived = new MetaDerivedIon(<DerivedIon>$derivedIon, retrack, !!methods);
    function $derivedIon() {
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

    const proto = {
        [META]: derived,
        untrack() {
            derived.untrackAtoms()
        }
    } as AnyObject

    if (methods) {
        for (const key in methods) {
            proto[key] = methods[key].bind(proto) // This makes set function available to `this` even after protected
        }
    }

    Object.setPrototypeOf($derivedIon, proto)

    onDestroy(() => {
        derived.untrackAtoms()
    })

    return <DerivedIon><unknown>$derivedIon;
}

export type WritableDerivedIon<T = any, M extends AnyObject = {}> = {
    ():T;
    set: (newValue: T) => T;
    [META]: MetaDerivedIon;
    untrack: () => void;
} & M

export function WritableDerivedIon<T, M>(config: { get: () => T, set: (value: T) => T }, methods?: M & { [key: string]: (...args: any[]) => any }) {
    const _methods = methods || { set: config.set }
    if (methods) _methods.set = config.set
    const writable = DerivedIon(config.get, _methods);
    return writable;
}
