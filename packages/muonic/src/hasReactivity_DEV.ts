import { getWithoutTracking } from "./derivations/DependencyTracker";

// export function useReactivity() {
//     const r = useReactiveModels();
//     const s = useSignals(r);


//     return {
//         $_o$$$: s.$$$,
//         $_o$: s.$$,
//         $: s.$,
//         o$$$: r.o$$$,
//         o$: r.o$,
//         set: s.set,
//         mu: r.mu,
//     }
// }

let _isSignal = false;

export function hasReactivity_DEV(maybeSignal: any): maybeSignal is Function {
    if (!(maybeSignal instanceof Function)) return false;
    console.warn('Using `hasReactivity_DEV` on a function with unknown side effects can cause bugs. To avoid unknown side-effects, use `isSignal` to check for reactivity and pass any impromptu getters into the $ function. `hasReactivity_DEV` is only to check if you have a wrapped signal')
    _isSignal = false;
    getWithoutTracking(maybeSignal)
    if (_isSignal) {
        _isSignal = false;
        return true;
    }
    return false;
}

export function emitSignal() {
    _isSignal = true;
}
