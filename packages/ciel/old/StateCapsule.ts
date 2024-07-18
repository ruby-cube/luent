import { effectScope, inject } from "vue";
import { CIEL } from "./Ciel";


export type StateCapsule = {
    [key: string]: any
}

//NOTE: All reactive effects created by the `createCapsule` function will exist for the lifetime of the app
export function defineStateCapsule<F extends (...initialSetupConfig: any[]) => StateCapsule>(name: string, createCapsule: F) {
    return function getCapsule(...initialSetupConfig: Parameters<F>) {
        const ciel = inject(CIEL)!;
        const depot = ciel.capsuleDepot;
        const existingCapsule = depot.get(name);
        if (existingCapsule) return existingCapsule;
        const scope = effectScope(true); // `true`: effect scope is detached from parent scope and will not be disposed when parent scope is disposed
        const capsule = scope.run(() => createCapsule(...initialSetupConfig));
        if (capsule == null) throw "`createCapsule` function does not create a state capsule"
        depot.set(name, capsule);
        return capsule as ReturnType<F>;
    }
}