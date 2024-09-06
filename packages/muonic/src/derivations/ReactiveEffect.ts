import { ReactiveDerivation } from "./ReactiveDerivation";

export function createReactiveEffect(effect: () => void, retrack: boolean) {

    const _effect = new ReactiveDerivation(reactiveEffect, retrack)

    let initialized = false;

    function reactiveEffect() {
        if (!initialized || _effect.dirty && retrack) {
            _effect.trackDependencies(effect);
            _effect.forwardDependencies(_effect.dependencies) //QUESTION: Not sure if reactive effects need to forward dependencies as well
            if (_effect.dirty) {
                _effect.undirty()
            }
            initialized = true;
        }
        else {
            effect()
        }
    }
    return reactiveEffect;
}