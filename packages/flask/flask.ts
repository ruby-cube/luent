//-@ts-nocheck

import { $schedule, Callback, Callbacks, PendingCancelOp, PendingOp, SchedulerOptions } from "../flask";
import { noop, run } from "@rue/utils";
import { computed$ } from "../signals/computed";
import { RootFlask, _rootFlaskClasses } from "./RootFlasks";
import { Scene, getScene } from "./Scene";
import { registerGlobalResetter } from "../dev/__resetGlobals";


export type ReactivityFlask = {
    onDisposed: (cb: () => void) => PendingCancelOp;
}


// If an async flask calls _getRootFlask() after an await, should it be able to access the original root flask? or should it return null?
// should root flasks cleanup async flasks?

let activeFlaskSetup: Flask | null | undefined = null;

if (__TEST__) registerGlobalResetter(() => activeFlaskSetup = null);


export function getFlask() {
    return activeFlaskSetup;
}

export function getOuterFlask() {
    return (<Flask>activeFlaskSetup)?._outerFlask || getRootFlask();
}

export function getRootFlask() {
    return (<Flask>activeFlaskSetup)?._root || _getRootFlask();
}


export function _getRootFlask() {
    for (const [targetGetter, RootFlask] of _rootFlaskClasses) {
        const target = targetGetter();
        if (target) {
            return new RootFlask(target) as RootFlask; // creates a new rootFlask for all nested flasks... not ideal, but its currently too much of a headache to create a map and rootFlask.onDisposed(()=>map.delete(target)) cuz it messes up all my tests :(
        }
    }
    return activeFlaskSetup;
}

export function _inRootSetup() {
    for (const [targetGetter] of _rootFlaskClasses) {
        const target = targetGetter();
        if (target) {
            return !!target;
        }
    }
    return !!activeFlaskSetup;
}




export class Flask implements ReactivityFlask {
    private disposalHandlers: Callbacks = new Set();
    _outerFlask: Flask | undefined | null;
    _root: Flask | RootFlask | Scene | undefined | null;
    outlivesOuter: boolean | undefined;
    constructor(
        root: Flask | RootFlask | Scene | undefined | null, // not sure what this would be used for
        outerFlask: Flask | null | undefined, // not sure what this would be used for
        outlivesOuter: boolean | undefined
    ) {
        this._root = root;
        this._outerFlask = outerFlask;
        this.outlivesOuter = outlivesOuter
    }

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
        _pauseSetup();
        try {
            const result = await promise
            return [result, null]
        }
        catch (err) {
            return [null, err]
        }
        finally {
            _resumeSetup(this);
        }
    }
}


function _pauseSetup() {
    activeFlaskSetup = null;
}

function _resumeSetup(flask: Flask) {
    activeFlaskSetup = flask;
}

function _startSetup(flask: Flask) {
    activeFlaskSetup = flask;
}

function _endSetup(flask: Flask) {
    activeFlaskSetup = flask._outerFlask;
}

function _resolveSetupEnd(flask: Flask, returnValue: any) {
    if (returnValue instanceof Promise) {
        return run(async () => {
            const result = await returnValue;
            _endSetup(flask);
            return result;
        });
    }
    else {
        _endSetup(flask);
        return returnValue;
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

export const OUTLIVE = true;

export function flaskSetup<T extends any | Promise<any>>(setUpFlask: (flask: Flask, outerFlask: ReactivityFlask) => T, outlivesOuter?: boolean) {
    const root = getScene() || _getRootFlask();
    const outerFlask = activeFlaskSetup;
    // if (!outerFlask) throw new Error("useFlask must be called during scene setup or component setup");
    const flask = new Flask(root, outerFlask, outlivesOuter);
    _startSetup(flask);
    // let result = setUpFlask(flask, outerFlask || flask);
    return _resolveSetupEnd(flask, setUpFlask(flask, outerFlask || root || flask)) as T;
}


export function enflask<A extends any[], T extends any | Promise<any>>(setUpFlask: (flask: Flask, outerFlask: ReactivityFlask, ...args: A) => T, outlivesOuter?: boolean) {
    return (...args: A) => {
        const root = getScene() || _getRootFlask();
        console.log("enflask root", root)
        const outerFlask = activeFlaskSetup;
        console.log("outerFlask??", outerFlask)
        // if (!rootFlask) throw new Error("useFlask must be called during scene setup or component setup");
        const flask = new Flask(root, outerFlask, outlivesOuter);
        console.log("start nested______________________________")
        _startSetup(flask);
        let result = setUpFlask(flask, outerFlask || root || flask, ...args);
        _resolveSetupEnd(flask, result);
        console.log("end nested______________________________")
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

// [ ] outlivesOuter option in computed, watch and watchEffect

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
    return flaskSetup(async (flask, outerFlask) => {
        const x$ = computed$(() => {

        })

        const [result, error] = await flask.after(fetch(""));

        outerFlask.onDisposed(() => {

        })

        return {
            x$
        }
    }, OUTLIVE)
}

