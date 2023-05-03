//-@ts-nocheck

import { $schedule, Callback, Callbacks, PendingCancelOp, PendingOp, SchedulerOptions } from "../flask";
import { noop, run } from "@rue/utils";
import { CovertFlask, _covertFlaskConfigs, getCovertFlask } from "./CovertFlasks";
import { Scene, getScene } from "./Scene";
import { registerGlobalResetter } from "@rue/dev";


// TODO: flask.after must handle pausing and resuming all outer flasks
// QUESTION: does setup have to be wrapped in enflask() for async?

export type Flask = {
    onDisposed: (cb: () => void) => PendingCancelOp;
    after: (promise: Promise<any>) => Promise<unknown[]>;
}


// If an async flask calls getCovertFlask() after an await, should it be able to access the original root flask? or should it return null?
// should root flasks cleanup async flasks?

let activeFlaskSetup: NestableFlask | null | undefined = null;

if (__TEST__) registerGlobalResetter(() => activeFlaskSetup = null);


export function getFlask() {
    return activeFlaskSetup;
}

export function getOuterFlask() {
    return (<NestableFlask>activeFlaskSetup)?._outerFlask;
}

export function getRootFlask() {
    return (<NestableFlask>activeFlaskSetup)?._root || getCovertFlask();
}



export class NestableFlask implements Flask {
    private disposalHandlers: Callbacks = new Set();
    _outerFlask: NestableFlask | undefined | null;
    _root: NestableFlask | CovertFlask | Scene | undefined | null;
    outlivesOuter: boolean | undefined;
    constructor(
        root: NestableFlask | CovertFlask | Scene | undefined | null, // not sure what this would be used for
        outerFlask: NestableFlask | null | undefined, // not sure what this would be used for
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

function _resumeSetup(flask: NestableFlask) {
    activeFlaskSetup = flask;
}

function _startSetup(flask: NestableFlask) {
    activeFlaskSetup = flask;
}

function _endSetup(flask: NestableFlask) {
    activeFlaskSetup = flask._outerFlask;
}

function _resolveSetupEnd(flask: NestableFlask, returnValue: any) {
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


// class NestableFlask implements Flask {
//     private scope: InternalEffectScope;
//     private state: Map<any, any> | undefined;
//     private outerFlask: Flask | null;

//     constructor(cb: (flask: NestableFlask, outerFlask: Flask | null) => void, public detached?: boolean) {
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

export function flaskSetup<T extends any | Promise<any>>(setUpFlask: (flask: NestableFlask, outerFlask: Flask) => T, outlivesOuter?: boolean) {
    const root = getScene() || getCovertFlask() || getFlask();
    const outerFlask = activeFlaskSetup;
    // if (!outerFlask) throw new Error("useFlask must be called during scene setup or component setup");
    const flask = new NestableFlask(root, outerFlask, outlivesOuter);
    _startSetup(flask);
    // let result = setUpFlask(flask, outerFlask || flask);
    return _resolveSetupEnd(flask, setUpFlask(flask, outerFlask || root || flask)) as T;
}


export function enflask<A extends any[], T extends any | Promise<any>>(setUpFlask: (flask: NestableFlask, outerFlask: Flask, ...args: A) => T, outlivesOuter?: boolean) {
    return (...args: A) => {
        const root = getScene() || getCovertFlask() || getFlask();
        console.log("enflask root", root)
        const outerFlask = activeFlaskSetup;
        console.log("outerFlask??", outerFlask)
        // if (!covertFlask) throw new Error("useFlask must be called during scene setup or component setup");
        const flask = new NestableFlask(root, outerFlask, outlivesOuter);
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
//     let state: any | null, flask: NestableFlask | null

//     const dispose = () => {
//         if (flask && --subscribers <= 0) {
//             flask.dispose();
//             state = flask = null
//         }
//     }

//     return (outerFlask: Flask, ...args: any[]) => {
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


// export function useMouse() {
//     return flaskSetup(async (flask, outerFlask) => {
//         const x$ = computed$(() => {

//         })

//         const [result, error] = await flask.after(fetch(""));

//         outerFlask.onDisposed(() => {

//         })

//         return {
//             x$
//         }
//     }, OUTLIVE)
// }

