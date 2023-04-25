//-@ts-nocheck

import { ComponentInternalInstance, EffectScope, effectScope, getCurrentInstance, getCurrentScope, onScopeDispose, onUnmounted } from "vue";


type ReactivityFlask = {
    onDisposed: (cb: () => void) => void;
}

type InternalEffectScope = EffectScope & {
    on: () => void;
    off: () => void;
}

let activeFlask: ReactivityFlask | null = null;

export function getOuterFlask() {
    return activeFlask && "outerFlask" in activeFlask ? activeFlask.outerFlask : null;
}

export function getFlask() {
    return activeFlask;
}

class Flask implements ReactivityFlask {
    private scope: InternalEffectScope;
    private state: Map<any, any> | undefined;
    private outerFlask: ReactivityFlask | null;

    constructor(cb: (flask: Flask, outerFlask: ReactivityFlask | null) => void, public detached?: boolean) {
        const outerFlask = this.outerFlask = activeFlask || getComponentFlask(); // FIX: see note on getComponentFlask
        const scope = this.scope = effectScope(detached) as InternalEffectScope;
        activeFlask = this;
        scope.run(() => cb(this, outerFlask));
        activeFlask = outerFlask;
    }

    onDisposed(cb: () => void) {
        this.scope.on();
        onScopeDispose(cb);
        this.scope.off();
    }

    dispose() {
        this.scope.stop()
    }

    set(key: any, value: any) {
        if (this.state === undefined) this.state = new Map();
        this.state.set(key, value);
    }

    get(key: any) {
        if (this.state === undefined) return undefined;
        return this.state.get(key);
    }

    expose(data: { [key: string | number | symbol]: any }) {
        if (this.state === undefined) this.state = new Map();
        for (const key in data) {
            this.state.set(key, data[key])
        }
    }
}

// QUESTION: Is there a use case for accessing a component's outer flask (i.e. the parent component flask)?

class ComponentFlask implements ReactivityFlask {
    private componentInstance: ComponentInternalInstance | null;
    constructor() {
        this.componentInstance = getCurrentInstance();
    }
    onDisposed(cb: () => void) {
        return onUnmounted(cb, this.componentInstance)
    }
}

export function getComponentFlask() { // FIX: the current implementation instantiates a new flask when getComponentFlask is called. Ideally, a new component flask is created at the beginning of setup. But I don't have access to Vue internals
    if (getCurrentInstance() == null) return null;
    activeFlask = new ComponentFlask();
    return new ComponentFlask();
}

export const OUTLIVE = true;

export function useFlask(cb: (flask: Flask) => void, outlive?: boolean) {
    return new Flask(cb, outlive);
}

export async function inFlask<T>(promise: Promise<T>) {
    const currentComponent = getCurrentInstance();
    const flask = activeFlask || getComponentFlask();
    if (__DEV__ && !flask) {
        console.warn(
            `inFlask called without active reactivity flask.`
        )
    }
    let res: Awaited<T>;
    // if (currentComponent) { //FIX: I don't have access to withAsyncContext :( Need to figure out another way 
    //     const [_res, restoreComponent] = await withAsyncContext(() => promise);
    //     res = _res;
    //     restoreComponent();
    // }
    // else {
        res = await promise;
    // }
    activeFlask = flask;
    return res;
}


getFlask;
getOuterFlask;
getComponentFlask;
useFlask;
inFlask;
OUTLIVE;

// [ ] outlive option in computed, watch and watchEffect

// const result = await inFlask(fetch(".."))

// function createSharedComposable(composable: (...args: any[]) => any) {
//     let subscribers = 0
//     let state: any | null, flask: Flask | null

//     const dispose = () => {
//         if (flask && --subscribers <= 0) {
//             flask.dispose();
//             state = flask = null
//         }
//     }

//     return (outerFlask: ReactivityFlask, ...args: any[]) => {
//         flask = useFlask(() => {
//             subscribers++
//             if (!state) {
//                 state = composable(...args);
//             }
//             outerFlask.onDisposed(dispose)
//         }, OUTLIVE)
//         return state;
//     }
// }

// const flask = useFlask((flask) => {
//     flask.dispose()

// });