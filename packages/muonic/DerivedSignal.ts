import { ActiveListener, getActiveFlask, onFlaskDisposal } from "@rue/flask";
import { DependencyTracker, getDependencyTracker } from "./DependencyTracker";
import { isSignal, Signal, SIGNAL_MARKER } from "./useSignals";
import { watch } from "./watch";
import { asReactiveProp, ReactiveProp } from "./ReactiveProp";
import { getCurrentUpdateCycle } from "./UpdateCycle";

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

const depMap: WeakMap<Signal | ReactiveProp, Set<DerivedSignal>> = new WeakMap(); // to get old value of derived signal during trigger
const watchedDerivedSignals: WeakSet<DerivedSignalState> = new WeakSet();

export function getDependentDerivedSignals(dep: Signal | ReactiveProp) {
    return depMap.get(dep);
}


function addToDepMap(derivedSignal: DerivedSignal, deps: (Signal | ReactiveProp)[]) {
    for (const dep of deps) {
        let derivedSignals = depMap.get(dep);
        if (!derivedSignals) {
            derivedSignals = new Set()
            depMap.set(dep, derivedSignals)
        }
        derivedSignals.add(derivedSignal)
    }

    derivedSignal[DERIVED_SIGNAL].removeFromDepMap = () => {
        for (const dep of deps) {
            const derivedSignals = depMap.get(dep)!;
            derivedSignals.delete(derivedSignal)
        }
    }
}


export class DerivedSignalState {
    value: any;
    dependencies: (Signal | ReactiveProp)[] = [];
    hasChanged: boolean = false;

    removeFromDepMap: undefined | (() => void);

    private watchers: ActiveListener[] = [];

    private stopPrevWatchers() {
        for (const watcher of this.watchers) {
            watcher.stop();
        }
        this.watchers = [];
    }

    private trackDependencies(getter: () => any, derivedSignal: DerivedSignal) {
        const tracker = new DependencyTracker();
        const [_, value] = tracker.callToCollectDependencies(getter);
        this.value = value;
        const deps = this.dependencies = tracker.dependencies

        // detect dirtying
        this.stopPrevWatchers();

        for (let i = 0; i < deps.length; i++) {
            const dep = deps[i]
            const _isSignal = isSignal(dep);
            const [reactive, key] = _isSignal ? [null, null] : dep;

            const watcher = watch(_isSignal ? dep : () => reactive![key!], (newValue: any) => {
                const updateCycle = getCurrentUpdateCycle()
                if (!updateCycle) throw new Error("no update cycle. not sure if this should happen")
                const oldValue = updateCycle.getInitialValue(dep);
                if (newValue !== oldValue) this.hasChanged = true;
            }, { phase: 'sync' }) //NOTE: Derived Signals that are *called* outside of a component's set up must be contained in a flask for cleanup. I think flask inheritance convers this?
            this.watchers.push(watcher);
        }

        if (__DEV__ && !getActiveFlask()) console.warn('derived signal is being used outside of a flask... this could lead to memory leaks')

        // To retreive initialValue from update cycle during trigger to be used as old value
        if (this.isWatched()) {
            const removeFromDepMap = derivedSignal[DERIVED_SIGNAL].removeFromDepMap
            if (removeFromDepMap) removeFromDepMap();
            addToDepMap(derivedSignal, deps);
        }
    }

    private updateValue(value: any) {
        this.value = value;
    }

    markAsWatched() {
        watchedDerivedSignals.add(this);
    }

    markUnwatched() {
        watchedDerivedSignals.delete(this);
    }

    isWatched() {
        return watchedDerivedSignals.has(this)
    }
}


export function makeDerivedSignal<T extends any>(pureGetter: () => T, retrack?: boolean): DerivedSignal<T> {
    let initialized = false;
    const derivedSignal = () => {
        const _this = (<DerivedSignal><unknown>derivedSignal)[DERIVED_SIGNAL]
        if (!_this) throw new Error("derived signal props not found")

        if (!initialized) {
            // @ts-expect-error private method
            _this.trackDependencies(pureGetter, <DerivedSignal><unknown>derivedSignal);
            initialized = true;
        }
        if (_this.hasChanged) {
            const newValue = pureGetter();
            // @ts-expect-error private method
            _this.updateValue(newValue)
            if (retrack) {
                //@ts-expect-error private method
                _this.trackDependencies(pureGetter, <DerivedSignal><unknown>derivedSignal) // to catch signals hidden in conditionals
            }
            return newValue;
        }

        // forward dependencies to outer dependency tracker
        const tracker = getDependencyTracker();
        if (tracker) {
            tracker.dependencies.push(..._this.dependencies)
        }

        return _this.value;
    }
    const props = new DerivedSignalState();
    (<DerivedSignal><unknown>derivedSignal)[DERIVED_SIGNAL] = props;

    return <DerivedSignal><unknown>derivedSignal;
}
