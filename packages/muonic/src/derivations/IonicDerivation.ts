import { DependencyTracker, getActiveTracker, getDependencyTracker } from "./DependencyTracker";
import { asIonicAtom, IonicAtom, ReactivePrimitive } from "./IonicAtom";
import { asWatchTarget, isWatched, WatchTarget } from "../effects/WatchTarget";
import { ReactiveEntity } from "../ReactiveEntity";



export class IonicDerivation<T = any> implements ReactiveEntity {

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
        if (isWatched(o)) {
            asWatchTarget(o).triggerEffects();
        }
    }

    atoms: Set<IonicAtom> = new Set()

    trackAtoms(ionicDerivation: () => any) {
        const tracker = new DependencyTracker();
        const [_, value] = tracker.callToCollectDependencies(ionicDerivation);
        const deps = this.atoms = tracker.deps;
        this.initializeAtoms(deps)
        return value;
    }

    private initializeAtoms(atoms: Set<IonicAtom>) {
        for (const atom of atoms) {
            atom.addDerivation(this)
        }
    }

    forwardAtoms(atoms: Set<IonicAtom>) {
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




