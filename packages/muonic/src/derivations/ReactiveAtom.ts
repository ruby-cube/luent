import { ReactivePrimitive } from "./DependencyTracker";
import { ReactiveDerivation } from "./ReactiveDerivation";

export const CLEAN_UP = 'x__cleanUp'

export class ReactiveAtom {

    constructor(public primitive: ReactivePrimitive) { }

    derivations: Set<ReactiveDerivation> = new Set() // replaces depMap and flagging of reactive atoms

    addDerivation(derivation: ReactiveDerivation) {
        this.derivations.add(derivation)
    }

    deleteDerivation(derivation: ReactiveDerivation) {
        this.derivations.delete(derivation)
        if (this.derivations.size === 0) {
            reactiveAtomMap.delete(this.primitive)
        }
        this.cleanUp?.()
    }

    triggerDerivations() {
        for (const derivation of this.derivations) {
            derivation.trigger();
        }
    }

    cleanUp?: () => void

    onUntracked(cleanUp: () => void) {
        if (__DEV__ && this.cleanUp) {
            console.error('Overriding existing cleanup function. This means we need an array for onUntracked tasks')
        }
        this.cleanUp = cleanUp;
    }
}

const reactiveAtomMap: WeakMap<ReactivePrimitive, ReactiveAtom> = new WeakMap()

export function isReactiveAtom(primitive: ReactivePrimitive | null | undefined) {
    if (!primitive) return false;
    return Boolean(reactiveAtomMap.get(primitive));
}

export function asReactiveAtom(primitive: ReactivePrimitive) {
    let atom = reactiveAtomMap.get(primitive);
    if (!atom) {
        atom = new ReactiveAtom(primitive)
        reactiveAtomMap.set(primitive, atom)
    }
    return atom;
}

