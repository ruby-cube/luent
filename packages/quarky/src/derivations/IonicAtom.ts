import { useRenderCycle } from "../effects/RenderCycle";
import { AtomicIon } from "../ion/AtomicIon";
import { isIonizedModel } from "../ionize/ionize";
import { PropIon } from "../ionize/PropIon";
import { TrackedOp } from "../ionize/TrackedOp";
import { IonicDerivation } from "./IonicDerivation";

export const CLEAN_UP = 'x__cleanUp'

export type ReactivePrimitive = AtomicIon | PropIon | TrackedOp


const reactiveAtomMap: WeakMap<ReactivePrimitive, IonicAtom> = new WeakMap()

export class IonicAtom {

    constructor(public primitive: ReactivePrimitive) {
        reactiveAtomMap.set(primitive, this)
    }

    derivations: Set<IonicDerivation> = new Set() // replaces depMap and flagging of reactive atoms

    addDerivation(derivation: IonicDerivation) {
        this.derivations.add(derivation)
    }

    deleteDerivation(derivation: IonicDerivation) {
        this.derivations.delete(derivation)
        if (this.derivations.size === 0) {
            reactiveAtomMap.delete(this.primitive)
        }
        this.cleanUp?.(this.primitive)
    }

    triggerDerivations(newValue: any, oldValue: any) {
      console.log('set ion value', newValue, oldValue)
        for (const derivation of this.derivations) {
         console.log('derivation', derivation)
            if (isIonizedModel(derivation.o)) {
                const reactive = derivation.o
                const atom = this.primitive;
                useRenderCycle().recordOp(reactive, {
                    target: atom,
                    op: 'set',
                    args: [newValue],
                    output: newValue,
                    preopData: oldValue
                })
            }
            derivation.trigger();
        }
    }

    cleanUp?: (primitive: ReactivePrimitive) => void

    onUntracked(cleanUp: (primitive: ReactivePrimitive) => void) {
        if (__DEV__ && this.cleanUp) {
            console.error('Overriding existing cleanup function. This means we need an array for onUntracked tasks')
        }
        this.cleanUp = cleanUp;
    }
}


export function isIonicAtom(primitive: ReactivePrimitive | null | undefined) {
    if (!primitive) return false;
    return Boolean(reactiveAtomMap.get(primitive));
}

export function asIonicAtom(primitive: ReactivePrimitive) {
    let atom = reactiveAtomMap.get(primitive)
    if (!atom) {
        atom = new IonicAtom(primitive)
    }
    return atom;
}


