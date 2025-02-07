import { AtomicIon } from "../ion/PrimaryIon";
import { PropIon } from "../ionized/PrimaryPion";
import { QUARKS, QuarkyEntity } from "../QuarkyEntity";
import { asIonicAtom } from "./IonicAtom";
import { IonicCompound } from "./IonicCompound";

// Used to create reactive effect and reactive getters

export type IonicEffect = {
    (...args: any[]): any;
    initialize: () => IonicEffect;
} & QuarkyEntity<IonicCompound>

function trackIonicEffect(derivation: IonicCompound, fn: () => any) {
    const value = derivation.trackAtoms(() => runIonicEffect(fn, derivation));
    // derivation.forwardAtoms(derivation.atoms)
    return value;
}

const IONIC_EFFECT = Symbol('ionicEffect')

// prevent infinite loop if ionic effect sets ion or ionic property synchronously
let currentMetaIonicEffect: IonicCompound | undefined

export function isIonicEffectAtom(atom: AtomicIon | PropIon) {
    if (!currentMetaIonicEffect) return false;
    return currentMetaIonicEffect.atoms.has(asAtom(atom));
}

function runIonicEffect(effect: () => void, meta: IonicCompound) {
    let prevMeta = currentMetaIonicEffect
    try {
        currentMetaIonicEffect = meta
        effect()
    }
    finally{
        currentMetaIonicEffect = prevMeta;
    }
}

export function createIonicEffect(fn: () => any, retrack: boolean) {
    if (retrack) {
        const derivation = new IonicCompound(ionicEffect, IONIC_EFFECT)

        function ionicEffect() {
            if (derivation.dirty) {
                trackIonicEffect(derivation, fn)
                derivation.undirty()
            }
            else {
                runIonicEffect(fn, derivation)
            }
        }
        ionicEffect[QUARKS] = derivation
        ionicEffect.initialize = () => {
            trackIonicEffect(derivation, fn);
            return ionicEffect;
        }

        return ionicEffect as IonicEffect
    }
    else {
        const derivation = new IonicCompound(ionicEffect, IONIC_EFFECT)
        function ionicEffect() {
            runIonicEffect(fn, derivation)
        }
        ionicEffect.initialize = () => {
            trackIonicEffect(derivation, fn);
            return ionicEffect;
        }
        ionicEffect[QUARKS] = derivation
        return ionicEffect as IonicEffect;
    }
}