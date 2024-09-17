import { DependencyTracker, getActiveTracker, getDependencyTracker } from "./DependencyTracker";
import { asReactiveAtom, ReactiveAtom, ReactivePrimitive } from "./ReactiveAtom";
import { AnyObject } from "@rue/types";
import { asWatchTarget, isWatched, WatchTarget } from "../effects/WatchTarget";
import { ReactiveFunction } from "./ReactiveFunction";
import { DerivedSignal } from "./DerivedSignal";
import { ReactiveEntity } from "../ReactiveEntity";



export class ReactiveDerivation<T = any> implements ReactiveEntity {

    constructor(
        readonly o: T,
        readonly type: symbol,
        public readonly retrack: boolean = false
    ) {
    }

    readonly dirty: boolean = false;

    undirty() {
        // @ts-expect-error readonly
        this.dirty = false;
    }

    trigger() {
        // @ts-expect-error readonly
        this.dirty = true;
        const o = this.o
        console.log("derivation!!", o)
        if (isWatched(o)) {
            asWatchTarget(o).triggerEffects();
        }
    }

    atoms: Set<ReactiveAtom> = new Set()

    trackAtoms(reactiveDerivation: () => any) {
        const tracker = new DependencyTracker();
        const [_, value] = tracker.callToCollectDependencies(reactiveDerivation);
        const deps = this.atoms = tracker.deps;
        this.initializeAtoms(deps)
        return value;
    }

    private initializeAtoms(atoms: Set<ReactiveAtom>) {
        for (const atom of atoms) {
            atom.addDerivation(this)
        }
    }

    forwardAtoms(atoms: Set<ReactiveAtom>) {
        const tracker = getActiveTracker()
        if (tracker) {
            for (const atom of atoms){
                tracker.deps.add(atom)
            }
        }
    }

    untrackAtoms() {
        for (const atom of this.atoms) {
            atom.deleteDerivation(this)
        }
        this.atoms.clear()
    }
}




