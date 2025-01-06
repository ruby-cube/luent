import { popEffect, pushEffect, runCleanups, ThisEffect } from "../effects/ThisEffect";
import { AtomicIon } from "../ion/AtomicIon";
import { Ref } from "../ion/Neutron";
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

function trackIonicEffect(derivation: IonicDerivation, fn: () => any, $activeEffect: Ref<ThisEffect>) {
    const value = derivation.trackAtoms(() => runIonicEffect(fn, derivation, $activeEffect));
    // derivation.forwardAtoms(derivation.atoms)
    return value;
}

const IONIC_EFFECT = Symbol('ionicEffect')

// prevent infinite loop if ionic effect sets ion or ionic property synchronously
let currentMetaIonicEffect: IonicDerivation | undefined

export function isIonicEffectAtom(atom: AtomicIon | PropIon) {
    if (!currentMetaIonicEffect) return false;
    return currentMetaIonicEffect.atoms.has(asIonicAtom(atom));
}

function runIonicEffect(effect: () => void, meta: IonicDerivation, $activeEffect: Ref<ThisEffect>) {
    let prevMeta = currentMetaIonicEffect
    try {
        runCleanups($activeEffect())
        const _effect = new ThisEffect();
        $activeEffect.value = _effect
        
        pushEffect(_effect)
        currentMetaIonicEffect = meta
        effect()
    }
    finally{
        popEffect()
        currentMetaIonicEffect = prevMeta;
    }
}

export function createIonicEffect(fn: () => any, $activeEffect: Ref<ThisEffect>, retrack: boolean) {
    if (retrack) {
        const derivation = new IonicDerivation(ionicEffect, IONIC_EFFECT, retrack)

        function ionicEffect() {
            if (derivation.dirty) {
                trackIonicEffect(derivation, fn, $activeEffect)
                derivation.undirty()
            }
            else {
                runIonicEffect(fn, derivation, $activeEffect)
            }
        }
        ionicEffect[META] = derivation
        ionicEffect.initialize = () => {
            trackIonicEffect(derivation, fn, $activeEffect);
            return ionicEffect;
        }

        return ionicEffect as IonicEffect
    }
    else {
        const derivation = new IonicDerivation(ionicEffect, IONIC_EFFECT)
        function ionicEffect() {
            runIonicEffect(fn, derivation, $activeEffect)
        }
        ionicEffect.initialize = () => {
            trackIonicEffect(derivation, fn, $activeEffect);
            return ionicEffect;
        }
        ionicEffect[META] = derivation
        return ionicEffect as IonicEffect;
    }
}