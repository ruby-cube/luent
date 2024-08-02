import { ActiveListener } from "@rue/flask";
import { DependencyTracker, ReactiveProp } from "./DependencyTracker";
import { isSignal, Signal, SIGNAL_MARKER } from "./useSignals";
import { hasChanged, watch } from "./watch";

// The $ function has various purposes
// - it marks a function as a reactive getter so that it can be distinguished from normal functions
// - it tracks the value of a derived signal and memoizes if needed
// - visually groups an arrow function getter and visually marks reactivity
// Signals created from $ function are not necessarily derived. They may be simple reactive getters, but for simplicity of code, they are all called derived signals and given derived signal props
// Note that siganl with only one dependency could still be a derived signal.


export const DERIVED_SIGNAL = Symbol()

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
    if (SIGNAL_MARKER in maybeSignal || DERIVED_SIGNAL in maybeSignal) return true;
    return false;
}

export class DerivedSignalState {
    value: any;
    dependencies: (Signal | ReactiveProp)[] = [];
    hasChanged: boolean = false;
    memoized: boolean = true;

    private watchers: ActiveListener[] = [];

    private stopPrevWatchers() {
        for (const watcher of this.watchers) {
            console.log("stopping previous")
            watcher.stop();
        }
        this.watchers = [];
    }

    private trackDependencies(getter: () => any, memoize: boolean) {
        const tracker = new DependencyTracker();
        const [_, value] = tracker.callToCollectDependencies(getter);
        this.value = value;
        const deps = this.dependencies = tracker.dependencies

        if (memoize || deps.length > 1) { // auto-memoize for multiple dependencies
            this.stopPrevWatchers();
            for (let i = 0; i < deps.length; i++) {
                const dep = deps[i]
                const _isSignal = isSignal(dep);
                const reactive = _isSignal ? null : dep[0];
                const key = _isSignal ? null : dep[1];
                const watcher = watch(_isSignal ? dep : () => reactive![key!], (newValue: any, oldValue: any) => {
                    if (hasChanged(newValue, oldValue)) this.hasChanged = true;
                }, { phase: 'sync' }) //NOTE: Derived Signals that are *called* outside of a component's set up must be contained in a flask for cleanup. I think flask inheritance convers this?
                this.watchers.push(watcher);
            }
        }
        else {
            this.memoized = false;
        }
    }

    private updateValue(value: any) {
        this.value = value;
    }
}


export function makeDerivedSignal<T extends any>(pureGetter: () => T, memoize?: 'memoize'): DerivedSignal<T> {
    let initialized = false;
    const derivedSignal = () => {
        //TODO: check for containing flask, warn if no flask
        const _this = (<DerivedSignal><unknown>derivedSignal)[DERIVED_SIGNAL]
        if (!_this) throw new Error("derived signal props not found")

        if (initialized === false) {
            // @ts-expect-error private method
            _this.trackDependencies(pureGetter, !!memoize);
            initialized = true;
        }
        if (_this.hasChanged || !_this.memoized) {
            const newValue = pureGetter();
            // @ts-expect-error private method
            _this.updateValue(newValue)
            //@ts-expect-error private method
            if (_this.memoized) _this.trackDependencies(pureGetter, !!memoize) // to catch signals hidden in conditionals
            return newValue;
        }
        return _this.value;
    }
    const props = new DerivedSignalState();
    (<DerivedSignal><unknown>derivedSignal)[DERIVED_SIGNAL] = props;

    return <DerivedSignal><unknown>derivedSignal;
}
