import { Ion } from "../ion/Ion";
import { ObservedProp } from "../ionize/ObservedProp";
import { PropIon } from "../ionize/PropIon";
import { META } from "../ReactiveEntity";
import { asIonicAtom } from "./IonicAtom";
import { IonicDerivation } from "./IonicDerivation";

// Used to create reactive effect and reactive getters

export type IonicEffect = {
    (...args: any[]): any;
    [META]: IonicDerivation;
    initialize: () => IonicEffect;
}

function trackIonicEffect(derivation: IonicDerivation, fn: () => any) {
    const value = derivation.trackAtoms(() => runIonicEffect(fn, derivation));
    // derivation.forwardAtoms(derivation.atoms)
    return value;
}

const IONIC_EFFECT = Symbol('ionicEffect')

// prevent infinite loop if ionic effect sets ion or ionic property synchronously
let currentMetaIonicEffect: IonicDerivation | undefined

export function isIonicEffectAtom(atom: Ion | PropIon) {
    if (!currentMetaIonicEffect) return false;
    return currentMetaIonicEffect.atoms.has(asIonicAtom(atom));
}

function runIonicEffect(effect: () => void, meta: IonicDerivation) {
    let prevMeta = currentMetaIonicEffect
    currentMetaIonicEffect = meta
    effect()
    currentMetaIonicEffect = prevMeta;
}

export function createIonicEffect(fn: () => any, retrack: boolean) {
    if (retrack) {
        const derivation = new IonicDerivation(ionicEffect, IONIC_EFFECT, retrack)

        function ionicEffect() {
            if (derivation.dirty) {
                trackIonicEffect(derivation, fn)
                derivation.undirty()
            }
            else {
                runIonicEffect(fn, derivation)
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
        function ionicEffect() {
            runIonicEffect(fn, derivation)
        }
        ionicEffect.initialize = () => {
            trackIonicEffect(derivation, fn);
            return ionicEffect;
        }
        ionicEffect[META] = derivation
        return ionicEffect as IonicEffect;
    }
}