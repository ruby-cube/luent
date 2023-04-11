import { ComputedRef, effectScope, inject, Ref } from "vue";
import { addProps } from "@rue/utils";
import {  UnionToIntersection } from "@rue/types";
import { CIEL } from "./Ciel";

export function defineStateSlice<F extends (...initialSetupConfig: any[]) => { [key: string]: Function }>(useStateSlice: F) {
    if (__DEV__) {
        const $useStateSlice = (safelyInvoked: boolean, ...initialSetupConfig: Parameters<F>) => {
            if (safelyInvoked !== true) throw "`useStateSlice` functions must be passed as a callback in `getAppState`";
            return useStateSlice(...initialSetupConfig);
        }
        return $useStateSlice as unknown as F;
    }
    return useStateSlice as F;
}

export type StateSlice = {
    [key: string]: Function | Ref | ComputedRef
}


//NOTE: All reactive effects created by the `createSlice` function will exist for the lifetime of the app
export function getAppState<N extends (() => any)[]>(slices: N) {
    const ciel = inject(CIEL)!
    const integratedSlices = ciel.integratedSlices;
    let state = ciel.state;
    for (const createSlice of slices) {
        if (!integratedSlices.has(createSlice)) {
            const scope = effectScope(true); // `true`: effect scope is detached from parent scope and will not be disposed when parent scope is disposed. Scope will be active for the lifetime of the app. QUESTION: Is there ever a use case where it's necessary to close scope when app unmounts?
            if (__DEV__) {
                // @ts-expect-error
                const slice = scope.run(() => createSlice(true)); // `true`: checks that createSlice is being called by getAppState
                state = addProps(state, slice);
            }
            else {
                const slice = scope.run(createSlice);
                state = addProps(state, slice);
            }
            integratedSlices.add(createSlice);
        }
    }
    return state as UnionToIntersection<ReturnType<(typeof slices)[number]>>;
}

