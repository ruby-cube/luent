import { DependencyTracker, getActiveTracker, getDependencyTracker } from "./DependencyTracker";
import { asIonicAtom, IonicAtom, ReactivePrimitive } from "./IonicAtom";
import { asWatchTarget, isWatched, WatchTarget } from "../effects/WatchTarget";
import { ReactiveEntity } from "../ReactiveEntity";
import { IonicModel, isIonicModel, toRaw } from "../ionize/IonicModel";
import { isAnyIon } from "../ion/AnyIon";
import { isDerivedIon } from "./DerivedIon";
import { isPropIon } from "../ionize/PropIon";
import { asMetaIon, isIon } from "../ion/Ion";



export class IonicDerivation<T = any> implements ReactiveEntity {

    constructor(
        readonly o: T,
        readonly type: symbol,
        public readonly retrack: boolean = false
    ) {
    }

    readonly dirty: boolean = false;

    markDirty(){
        // @ts-expect-error readonly
        this.dirty = true;
    }

    undirty() {
        // @ts-expect-error readonly
        this.dirty = false;
    }

    trigger() {
        this.markDirty()
        const o = this.o
        if (isWatched(o)) {
            asWatchTarget(o).triggerEffects();
        }
    }

    atoms: Set<IonicAtom> = new Set()

    trackAtoms(ionicDerivation: (() => any) | IonicModel) {
        const tracker = new DependencyTracker();
        let value;
        let deps;
        if (isIonicModel(ionicDerivation)) {
            deps = collectAbsorbedIons(ionicDerivation, tracker);
        }
        else {
            [deps, value] = tracker.callToCollectDependencies(ionicDerivation);
        }
        this.atoms = deps;
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
            for (const atom of atoms) {
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


function collectAbsorbedIons(ionicModel: IonicModel, tracker: DependencyTracker) {
    const target = toRaw(ionicModel);
    for (const key in target) {
        const value = target[key]
        if (isIon(value)) {
            tracker.track(value)
        }
        else if (isDerivedIon(value)) {
            tracker.callToCollectDependencies(value)
        }
        else if (isPropIon(value)) {
            tracker.track(asMetaIon(value).asObservedProp)
        }
    }
    return tracker.deps
}

