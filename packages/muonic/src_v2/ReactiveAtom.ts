import { ReactivePrimitive } from "../src/DependencyTracker";
import { ReactiveDerivation } from "./ReactiveDerivation";



export class ReactiveAtom {

    constructor(public primitive: ReactivePrimitive) { }

    derivations: Set<ReactiveDerivation> = new Set() // replaces depMap and flagging of reactive atoms

    addDerivation(derivation: ReactiveDerivation) {
        this.derivations.add(derivation)
    }

    deleteDerivation(derivation: ReactiveDerivation) {
        this.derivations?.delete(derivation)
    }

    triggerDerivations() {
        for (const derivation of this.derivations) {
            derivation.trigger();
        }
    }
}

const reactiveAtomMap: WeakMap<ReactivePrimitive, ReactiveAtom> = new WeakMap()

export function isReactiveAtom(primitive: ReactivePrimitive) {
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

