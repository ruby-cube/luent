import { getWithoutTracking } from "./DependencyTracker";
import { DerivedSignal, makeDerivedSignal } from "./useDerivedSignal";
import { Signal, signalize } from "./useSignalize";

// export function useReactivity() {
//     const s = useSignalize();
//     const r = useReactivize();

//     return {
//         $: s.$,
//         set: s.set,
//         reactivize: r.reactivize,
//         mu: r.mu
//     }
// }

export function $<T>(pureGetter: () => T, memoize?: "memoize"): DerivedSignal<T>
export function $<T>(value: T): Signal<T>
export function $<T>(valueOrPureGetter: T | (() => T), memoize?: "memoize"): Signal<T> | DerivedSignal<T> {
    if (valueOrPureGetter instanceof Function){
        return makeDerivedSignal(valueOrPureGetter, memoize)
    }
    return signalize(valueOrPureGetter)
}


let _hasSignal = false;

export function hasReactivity_Dev(maybeSignal: any): maybeSignal is Function {
    if (!(maybeSignal instanceof Function)) return false;
    console.warn('Using `hasReactivity_Dev` on a function with unknown side effects can cause bugs. To avoid unknown side-effects, use `hasSignal` to check for reactivity and pass any impromptu getters into the $ function. `hasReactivity_Dev` is only to check if you have a wrapped signal')
    _hasSignal = false;
    getWithoutTracking(maybeSignal)
    if (_hasSignal) {
        _hasSignal = false;
        return true;
    }
    return false;
}

export function emitSignal() {
    _hasSignal = true;
}
