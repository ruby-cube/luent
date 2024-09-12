import { META } from "../ReactiveEntity";
import { ReactiveDerivation } from "./ReactiveDerivation";

// Used to create reactive effect and reactive getters

export type ReactiveFunction = {
    (...args: any[]): any;
    [META]: ReactiveDerivation;
    initialize: () => ReactiveFunction;
}

function trackReactiveFunction(derivation: ReactiveDerivation, fn: () => any) {
    const value = derivation.trackAtoms(fn);
    derivation.forwardAtoms(derivation.atoms) //QUESTION: Not sure if reactive effects need to forward dependencies as well
    return value;
}

const REACTIVE_FUNCTION = Symbol('reactiveFunction')

export function createReactiveFunction(fn: () => any, retrack: boolean) {
    if (retrack) {
        const derivation = new ReactiveDerivation(reactiveFunction,REACTIVE_FUNCTION, retrack)

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
        reactiveFunction[META] = derivation
        reactiveFunction.initialize = () => {
            trackReactiveFunction(derivation, fn);
            return reactiveFunction;
        }

        return reactiveFunction as ReactiveFunction
    }
    else {
        const derivation = new ReactiveDerivation(reactiveFunction, REACTIVE_FUNCTION)
        function reactiveFunction(){
            return fn()
        }
        reactiveFunction.initialize = () => {
            trackReactiveFunction(derivation, fn);
            return fn;
        }
        reactiveFunction[META] = derivation
        return reactiveFunction as ReactiveFunction;
    }
}