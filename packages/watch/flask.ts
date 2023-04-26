//-@ts-nocheck

import { $schedule, Callback, Callbacks, PendingCancelOp, PendingOp, SchedulerOptions } from "@rue/planify";
import { noop, run } from "@rue/utils";
import { ComponentInternalInstance, EffectScope, computed, effectScope, getCurrentInstance, getCurrentScope, onScopeDispose } from "vue";
import { computed$ } from "../signals/computed";
import exp from "constants";
import { inComponentSetup, onComponentUnmounted } from "../paravue/component";
import { RootFlask, _rootFlaskClasses } from "./RootFlasks";


export type ReactivityFlask = {
    onDisposed: (cb: () => void) => void;
}


// If an async flask calls getRootFlask() after an await, should it be able to access the original root flask? or should it return null?
// should root flasks cleanup async flasks?

let activeFlaskSetup: Flask | null | undefined = null;

export function getFlask() {
    return activeFlaskSetup;
}

export function getRootFlask() {
    for (const [getTarget, RootFlask] of _rootFlaskClasses) {
        const target = getTarget();
        if (target) {
            return new RootFlask(target);
        }
    }
    return activeFlaskSetup;
}


function getSceneFlask() {
    return {} as ReactivityFlask | null
}


function defineRootFlask() {

}


// function getRootFlask() {
//     getRootFlask() || getSceneFlask();
//     return {} as ReactivityFlask | null
// }



export class Flask implements ReactivityFlask {
    outerFlask: Flask | null | undefined;
    private disposalHandlers: Callbacks = new Set();
    constructor(
        private root: RootFlask | null | undefined,
        private outlivesRoot: boolean | undefined
    ) { }

    onDisposed(handler?: Callback, options?: SchedulerOptions) {
        if (handler == null) {
            handler = noop;
        }
        const handlers = this.disposalHandlers;
        return $schedule(handler, options, {
            enroll: (handler) => {
                handlers.add(handler)
            },
            remove: (handler) => {
                handlers.delete(handler)
            }
        })
    }

    dispose() {
        const handlers = this.disposalHandlers;
        for (const cb of handlers) {
            cb()
        }
    }

    async after<T>(promise: Promise<T>) {
        if (__DEV__ && activeFlaskSetup !== this) {
            throw new Error(`flask.after() called outside of flask setup.`)
        }
        _endSetup(this);
        try {
            const result = await promise
            return [result, null]
        }
        catch (err) {
            return [null, err]
        }
        finally {
            _startSetup(this);
        }
    }
}


function _startSetup(flask: Flask) {
    flask.outerFlask = activeFlaskSetup;
    activeFlaskSetup = flask;
}

function _endSetup(flask: Flask) {
    flask.outerFlask = flask.outerFlask?.outerFlask;
    activeFlaskSetup = flask.outerFlask;
}

function _resolveSetupEnd(flask: Flask, returnValue: any) {
    if (returnValue instanceof Promise) {
        run(async () => {
            await returnValue;
            _endSetup(flask);
        });
    }
    else {
        _endSetup(flask);
    }
}


// class Flask implements ReactivityFlask {
//     private scope: InternalEffectScope;
//     private state: Map<any, any> | undefined;
//     private outerFlask: ReactivityFlask | null;

//     constructor(cb: (flask: Flask, outerFlask: ReactivityFlask | null) => void, public detached?: boolean) {
//         const outerFlask = this.outerFlask = activeFlaskSetup || getComponentFlask(); // FIX: see note on getComponentFlask
//         const scope = this.scope = effectScope(detached) as InternalEffectScope;
//         activeFlaskSetup = this;
//         scope.run(() => cb(this, outerFlask));
//         activeFlaskSetup = outerFlask;
//     }

//     onDisposed(cb: () => void) {
//         this.scope.on();
//         onScopeDispose(cb);
//         this.scope.off();
//     }

//     dispose() {
//         this.scope.stop()
//     }

//     set(key: any, value: any) {
//         if (this.state === undefined) this.state = new Map();
//         this.state.set(key, value);
//     }

//     get(key: any) {
//         if (this.state === undefined) return undefined;
//         return this.state.get(key);
//     }

//     expose(data: { [key: string | number | symbol]: any }) {
//         if (this.state === undefined) this.state = new Map();
//         for (const key in data) {
//             this.state.set(key, data[key])
//         }
//     }
// }

// QUESTION: Is there a use case for accessing a component's outer flask (i.e. the parent component flask)?








// export function getComponentFlask() { // FIX: the current implementation instantiates a new flask when getComponentFlask is called. Ideally, a new component flask is created at the beginning of setup. But I don't have access to Vue internals
//     if (getCurrentInstance() == null) return null;
//     activeFlaskSetup = new ComponentFlask();
//     return new ComponentFlask();
// }

export const OUTLIVE_ROOT = true;

export function flaskSetup<T extends any | Promise<any>>(setUpFlask: (flask: Flask, rootFlask: ReactivityFlask) => T, outlive?: boolean) {
    const rootFlask = getRootFlask();
    // if (!rootFlask) throw new Error("useFlask must be called during scene setup or component setup");
    const flask = new Flask(rootFlask, outlive);
    _startSetup(flask);
    let result = setUpFlask(flask, rootFlask || flask);
    _resolveSetupEnd(flask, result);
    return result;
}


export function enflask<A extends any[], T extends any | Promise<any>>(setUpFlask: (flask: Flask, rootFlask: ReactivityFlask, ...args: A) => T, outlive?: boolean) {
    return (...args: A) => {
        const rootFlask = getRootFlask();
        // if (!rootFlask) throw new Error("useFlask must be called during scene setup or component setup");
        const flask = new Flask(rootFlask, outlive);
        _startSetup(flask);
        let result = setUpFlask(flask, rootFlask || flask, ...args);
        _resolveSetupEnd(flask, result);
        return result;
    }
}



// export async function inFlask<T>(promise: Promise<T>) {
//     const currentComponent = getCurrentInstance();
//     const flask = activeFlaskSetup || getComponentFlask();
//     if (__DEV__ && !flask) {
//         console.warn(
//             `inFlask called without active reactivity flask.`
//         )
//     }
//     let res: Awaited<T>;
//     // if (currentComponent) { //FIX: I don't have access to withAsyncContext :( Need to figure out another way 
//     //     const [_res, restoreComponent] = await withAsyncContext(() => promise);
//     //     res = _res;
//     //     restoreComponent();
//     // }
//     // else {
//     res = await promise;
//     // }
//     activeFlaskSetup = flask;
//     return res;
// }


// getFlask;
// getOuterFlask;
// getComponentFlask;
// useFlask;
// inFlask;
// OUTLIVE;

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



// function reMouseDown() {
//     sceneSetup(async (scene) => {
//         onMouseMove(document, () => {
//             // do stuff
//         })




//         onMouseUp(document, () => {
//             // do stuff
//             scene.end();
//         })
//     });
// }


export function useMouse() {
    return flaskSetup(async (flask, rootFlask) => {
        const x$ = computed$(() => {

        })

        const [result, error] = await flask.after(fetch(""));

        rootFlask.onDisposed(() => {

        })

        return {
            x$
        }
    }, OUTLIVE_ROOT)
}

