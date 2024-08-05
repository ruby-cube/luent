import { AnyObject } from "@rue/types";
import { track, trigger } from "./watch";
import { emitSignal } from "./useReactivity";
import { DerivedSignal, makeDerivedSignal } from "./DerivedSignal";
import { isDeepReactive, isReactiveModel, ReactiveModel, useReactiveModels } from "./useReactiveModels";
import { getDependencyTracker } from "./DependencyTracker";
import { getCurrentUpdateCycle } from "./UpdateCycle";

export type Signal<T = any> = { (): T;[SIGNAL_MARKER]: boolean; }
export const SIGNAL_MARKER = Symbol();
export const SetKey = Symbol();

const $$$DEPTH = 3;
const $$DEPTH = 2;


export function useSignals(reactiveModelKit?: {
    o$$$<T extends AnyObject>(target: T): ReactiveModel<T>;
    o$<T extends AnyObject>(target: T): ReactiveModel<T>;
    mu<T extends ReactiveModel>(target: T, mutation: (o: T) => void): void;
}) {
    if (!reactiveModelKit) {
        reactiveModelKit = useReactiveModels();
    }
    const signalValues: WeakMap<Signal, any> = new WeakMap();
    const $$DepthSignals: WeakSet<Signal> = new WeakSet();
    const $$$DepthSignals: WeakSet<Signal> = new WeakSet();


    function set<T>(signal: Signal<T>, genNewValue: (value: T) => T) {
        if (!(SIGNAL_MARKER in signal))
            throw new Error("[Invalid Input] `set` can only set type `Signal`")

        if (!signalValues.has(signal))
            throw new Error("Signal must be set by its corresponding locally instantiated set function")



        const value = signal();
        const newValue = genNewValue(value)

        if (value === newValue) return value;

        const _newValue = newValue instanceof Object ?
            $$$DepthSignals.has(signal) ? reactiveModelKit!.o$$$(newValue) :
                $$DepthSignals.has(signal) ? reactiveModelKit!.o$(newValue) :
                    newValue : newValue

        const updateCycle = trigger(signal, _newValue, value);
        updateCycle.storeInitialValue(signal, value);

        signalValues.set(signal, _newValue);

        return _newValue;
    }

    function signalize<T>(value: T, deep?: 2 | 3): Signal<T> {

        const signal = () => {
            emitSignal();
            const value = signalValues.get(signal)
            track(signal)
            return value;
        }

        if (__DEV__ && deep && !(value instanceof Object)) {
            console.warn('Cannot deep signalize a non-referential data primitive such as number, string, boolean')
        }

        const _value = value instanceof Object ?
            deep === $$$DEPTH ? reactiveModelKit!.o$$$(value)
                : deep == $$DEPTH ? reactiveModelKit!.o$(value)
                    : value : value;

        // mark reactive depth of value
        if (value instanceof Object) {
            if (deep === $$$DEPTH || isDeepReactive(value)) {
                $$$DepthSignals.add(signal)
            }
            else if (deep === $$DEPTH || isReactiveModel(value)) {
                $$DepthSignals.add(signal);
            }
        }

        signalValues.set(signal, _value)
        signal[SIGNAL_MARKER] = true;
        signal[SetKey] = set;

        return signal;
    }

    function $<T>(pureGetter: () => T, retrack?: true): DerivedSignal<T>
    function $<T>(value: T): Signal<T>
    function $<T>(valueOrPureGetter: T | (() => T), retrack?: true): Signal<T> | DerivedSignal<T> {
        if (valueOrPureGetter instanceof Function) {
            return makeDerivedSignal(valueOrPureGetter, retrack)
        }
        return signalize(valueOrPureGetter)
    }


    function $$$<T extends AnyObject>(value: T): Signal<T> {
        return signalize(value, $$$DEPTH)
    }

    function $$<T extends AnyObject>(value: T): Signal<T> {
        return signalize(value, $$DEPTH)
    }


    return {
        $$$,
        $$,
        $,
        set,
        mu: reactiveModelKit.mu
    }
}


export function isSignal(maybeSignal: any): maybeSignal is Signal {
    if (maybeSignal instanceof Function) return SIGNAL_MARKER in maybeSignal;
    return false;
}



