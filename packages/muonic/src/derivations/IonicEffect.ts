import { META } from "../ReactiveEntity";
import { IonicDerivation } from "./IonicDerivation";

// Used to create reactive effect and reactive getters

export type IonicEffect = {
    (...args: any[]): any;
    [META]: IonicDerivation;
    initialize: () => IonicEffect;
}

function trackIonicEffect(derivation: IonicDerivation, fn: () => any) {
    const value = derivation.trackAtoms(fn);
    derivation.forwardAtoms(derivation.atoms)
    return value;
}

const IONIC_EFFECT = Symbol('ionicEffect')

export function createIonicEffect(fn: () => any, retrack: boolean) {
    if (retrack) {
        const derivation = new IonicDerivation(ionicEffect,IONIC_EFFECT, retrack)

        function ionicEffect() {
            if (derivation.dirty) {
                const value = trackIonicEffect(derivation, fn)
                derivation.undirty()
                return value;
            }
            else {
                return fn()
            }
        }
        ionicEffect[META] = derivation
        ionicEffect.initialize = () => {
            trackIonicEffect(derivation, fn);
            return ionicEffect;
        }

        return ionicEffect as IonicEffect
    }
    else {
        const derivation = new IonicDerivation(ionicEffect, IONIC_EFFECT)
        function ionicEffect(){
            return fn()
        }
        ionicEffect.initialize = () => {
            trackIonicEffect(derivation, fn);
            return ionicEffect;
        }
        ionicEffect[META] = derivation
        return ionicEffect as IonicEffect;
    }
}