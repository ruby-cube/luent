import { ReactiveEffect } from "../effects/watch";
import { ReactiveDerivation } from "./ReactiveDerivation";

export const AS_DERIVATION = 'x__asDerivation'

export function createReactiveEffect(effect: () => void, retrack: boolean) {

    const derivation = new ReactiveDerivation(reactiveEffect, retrack)

    let initialized = false;

    function reactiveEffect() {
        if (!initialized || derivation.dirty && retrack) {
            derivation.trackDependencies(effect);
            derivation.forwardDependencies(derivation.dependencies) //QUESTION: Not sure if reactive effects need to forward dependencies as well
            if (derivation.dirty) {
                derivation.undirty()
            }
            initialized = true;
        }
        else {
            effect()
        }
    }

    return reactiveEffect as ReactiveEffect
}


