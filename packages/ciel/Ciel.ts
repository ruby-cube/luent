import { MiscObj } from '@rue/types';
import { App, InjectionKey } from "vue"
import type { StateCapsule } from "./StateCapsule"
import type { StateSlice } from "./StateSlice";

/* 

STATUS: WIP
[v] Get it to work
[ ] Code review
[ ] Unit tests (prior to refactors)

*/


export type Ciel = {
    toApp: App;
    state: MiscObj;
    integratedSlices: Set<() => StateSlice>;
    capsuleDepot: Map<string, StateCapsule>;
}

export const CIEL = __DEV__ ? Symbol('ciel') : Symbol() as InjectionKey<Ciel>

// Creates a Ciel instance to be used by the application
export function createCiel() {
    const _ciel = {
        install(app: App) {
            const ciel = {
                toApp: app,
                state: {},
                integratedSlices: new Set() as Set<() => StateSlice>,
                capsuleDepot: new Map() as Map<string, StateCapsule>
            };
            app.provide(CIEL, ciel);
        },
    }
    return _ciel;
}