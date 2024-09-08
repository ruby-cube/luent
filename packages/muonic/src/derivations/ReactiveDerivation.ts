import { DependencyTracker, getDependencyTracker, getWithoutTracking, ReactivePrimitive } from "./DependencyTracker";
import { asReactiveAtom, ReactiveAtom } from "./ReactiveAtom";
import { asWatchTarget, isWatched, ReactiveEffect } from "../effects/watch";
import { DerivedSignal, isDerivedSignal } from "./DerivedSignal";
import { AS_DERIVATION } from "./ReactiveEffect";
import { ReactiveGetter } from "./ReactiveGetter";
import { AnyObject } from "@rue/types";



export class ReactiveDerivation {

    constructor(
        public readonly o: AnyObject,
        public readonly retrack: boolean = false
    ) { 
        o[AS_DERIVATION] = this;
    }

    readonly dirty: boolean = false;

    undirty() {
        // @ts-expect-error readonly
        this.dirty = false;
    }

    trigger() {
        // @ts-expect-error readonly
        this.dirty = true;
        const reactiveEntity = this.o;
        if (isWatched(reactiveEntity)) {
            asWatchTarget(reactiveEntity).triggerEffects();
        }
    }

    dependencies: ReactivePrimitive[] = []
    atoms: ReactiveAtom[] = []

    trackDependencies(reactiveDerivation: () => any) {
        const tracker = new DependencyTracker();
        const [_, value] = tracker.callToCollectDependencies(reactiveDerivation);
        const deps = this.dependencies = tracker.dependencies;
        this.initializeAtoms(deps)

        return value;
    }

    private initializeAtoms(deps: ReactivePrimitive[]) {
        this.resetAtoms();

        for (let i = 0; i < deps.length; i++) {
            const dep = deps[i]
            const atom = asReactiveAtom(dep)
            this.atoms.push(atom)
            atom.addDerivation(this)
        }
    }

    forwardDependencies(deps: ReactivePrimitive[]) {
        const tracker = getDependencyTracker()
        if (tracker) {
            tracker.dependencies.push(...deps)
        }
    }

    resetAtoms(){
        for (const atom of this.atoms) {
            atom.deleteDerivation(this)
        }
        this.atoms.length = 0;
    }

    untrackDependencies(){
        this.resetAtoms();
        this.dependencies.length = 0;
        
    }
}




