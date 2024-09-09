import { AS_DERIVATION, ReactiveDerivation } from "./ReactiveDerivation";

// Used to create reactive effect and reactive getters

export type ReactiveFunction = {
    (...args: any[]): any;
    [AS_DERIVATION]: ReactiveDerivation;
    initialize: () => ReactiveFunction;
}

function trackReactiveFunction(derivation: ReactiveDerivation, fn: () => any) {
    const value = derivation.trackDependencies(fn);
    derivation.forwardDependencies(derivation.dependencies) //QUESTION: Not sure if reactive effects need to forward dependencies as well
    return value;
}

export function createReactiveFunction(fn: () => any, retrack: boolean) {
    if (retrack) {
        const derivation = new ReactiveDerivation(reactiveFunction, retrack)

        function reactiveFunction() {
            if (derivation.dirty) {
                const value = trackReactiveFunction(derivation, fn)
                derivation.undirty()
                return value;
            }
            else {
                return fn()
            }
        }
        reactiveFunction.initialize = () => {
            trackReactiveFunction(derivation, fn);
            return reactiveFunction;
        }

        return reactiveFunction as ReactiveFunction
    }
    else {
        const derivation = new ReactiveDerivation(fn)
        //@ts-expect-error
        fn.initialize = () => {
            trackReactiveFunction(derivation, fn);
            return fn;
        }
        return fn as ReactiveFunction;
    }
}