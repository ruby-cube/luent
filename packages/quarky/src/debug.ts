import { __devCheckIfTracked, getWithoutTracking } from "./derivations/DependencyTracker";
import { isAnyIon } from "./ion/AnyIon";


let _isSignal = false;

export function hasReactivity_DEV(maybeHasSignal: any): maybeHasSignal is Function {
    if (!(maybeHasSignal instanceof Function) && !isAnyIon(maybeHasSignal)) return false;
    console.warn('Using `hasReactivity_DEV` on a function with unknown side effects can cause bugs. To avoid unknown side-effects, use `isAnyIon` to check for reactivity and pass any impromptu getters into the $ function. `hasReactivity_DEV` is only to check if you have a wrapped signal')
    _isSignal = false;
    getWithoutTracking(maybeHasSignal)
    if (_isSignal) {
        _isSignal = false;
        return true;
    }
    return false;
}

export function emitSignal() {
    _isSignal = true;
}
