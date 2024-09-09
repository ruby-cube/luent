import { WatchTarget } from "../effects/WatchTarget";
import { ReactivePrimitive } from "../ReactivePrimitive";
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
            this.primitive.destroyAsAtom()
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

// WeakMap causes memory leak since ReactiveAtom references the Reactive primitive
// const reactiveAtomMap: WeakMap<ReactivePrimitive, ReactiveAtom> = new WeakMap()

export function isReactiveAtom(primitive: ReactivePrimitive | null | undefined) {
    if (!primitive) return false;
    return Boolean(primitive.asAtom);
}

export function asReactiveAtom(primitive: ReactivePrimitive) {
    let atom = primitive.asAtom;
    if (!atom) {
        atom = new ReactiveAtom(primitive)
        primitive.initializeAsAtom(atom)
    }
    return atom;
}


