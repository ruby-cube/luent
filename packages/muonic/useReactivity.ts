import { getWithoutTracking } from "./DependencyTracker";
import { ReactiveObject, useReactivize } from "./useReactivize";
import { isSignal, Signal, useSignalize } from "./useSignalize"

export function useReactivity() {
    const s = useSignalize();
    const r = useReactivize();

    return {
        toSignal: s.toSignal,
        set: s.set,
        reactivize: r.reactivize,
        mu: r.mu
    }
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
