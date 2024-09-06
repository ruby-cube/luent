import { DependencyTracker, getDependencyTracker, getWithoutTracking, ReactivePrimitive } from "./DependencyTracker";
import { asReactiveAtom, ReactiveAtom } from "./ReactiveAtom";
import { asWatchTarget, isWatched, ReactiveEffect } from "../effects/watch";
import { useUpdateCycle } from "../effects/UpdateCycle";
import { DerivedSignal, isDerivedSignal } from "./DerivedSignal";



export class ReactiveDerivation<T extends DerivedSignal | ReactiveEffect = DerivedSignal | ReactiveEffect> {

    constructor(
        public readonly o: T,
        public readonly retrack: boolean = false
    ) { }

    readonly dirty: boolean = false;

    undirty() {
        // @ts-expect-error readonly
        this.dirty = false;
    }

    trigger() {
        const reactiveEntity = this.o;
        if (isWatched(reactiveEntity)) {
            if (isDerivedSignal(reactiveEntity)) {
                const updateCycle = useUpdateCycle()
                updateCycle.storeInitialValue(reactiveEntity, getWithoutTracking(reactiveEntity))
            }
            asWatchTarget(reactiveEntity).triggerEffects();
        }
        // @ts-expect-error readonly
        this.dirty = true;
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

    resetAtoms() {
        for (const atom of this.atoms) {
            atom.deleteDerivation(this)
        }
        this.atoms.length = 0;
    }
}




