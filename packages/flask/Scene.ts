//@ts-nocheck
import { $schedule, Callback, Callbacks, markSceneSetup, OneTimeListener, ScheduledOp, SchedulerOptions } from './flaskedListeners';
import { noop, run } from "@rue/utils";
import { registerSceneCleanup } from './x_scheduleSceneCleanup';
import { CovertFlask } from './CovertFlasks';
import { getCovertFlask, _inCovertFlaskSetup, getFlask } from './flask';
import { PendingOp } from './PendingOp';
import { onMounted } from 'vue';

// export type Scene = {
//     end: () => void;
//     onEnded: SceneEndListener;
//     resume: ()=>void;
// }

export class Scene {
    // outerScene: Scene | null | undefined;
    private endHandlers: Callbacks = new Set();
    onDisposed: (handler?: Callback, options?: SchedulerOptions) => PendingOp<any>; // internal

    constructor() {
        this.onDisposed = this.onEnded;
    }

    onEnded(handler?: Callback, options?: SchedulerOptions) {
        if (handler == null) {
            handler = noop;
        }
        const handlers = this.endHandlers;
        return $schedule(handler, options, {
            enroll: (handler) => {
                handlers.add(handler)
            },
            remove: (handler) => {
                handlers.delete(handler)
            }
        })
    }

    end() {
        const handlers = this.endHandlers;
        for (const cb of handlers) {
            cb()
        }
    }

    async after<T>(promise: Promise<T>) {
        if (__DEV__ && activeSceneSetup !== this) {
            throw new Error(`scene.after() called outside of scene setup.`)
        }
        _endSetup();
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


function _startSetup(scene: Scene) {
    activeSceneSetup = scene;
}

function _endSetup() {
    activeSceneSetup = null;
}

// function _startSetup(scene: Scene) {
//     scene.outerScene = activeSceneSetup;
//     activeSceneSetup = scene;
//     // registerSceneCleanup(scene);
//     // markSceneSetup(true);
// }

// function _endSetup(scene: Scene) {
//     activeSceneSetup = scene.outerScene;
//     scene.outerScene = scene.outerScene?.outerScene;
//     // registerSceneCleanup(activeSceneSetup);
//     // markSceneSetup(!!activeSceneSetup || false);
// }

// export type SceneEndListener = (handler?: Callback, options?: SchedulerOptions)=> ScheduledOp<Callback>;

// export const UNATTACHED = true;

let activeSceneSetup: Scene | null | undefined;

export function getScene() {
    return activeSceneSetup;
}

export function inSceneSetup() {
    return Boolean(activeSceneSetup);
}

function throwNoNestedScenes() {
    if (getScene() || getFlask() || _inCovertFlaskSetup()) throw new Error("Scene cannot be nested in another flask, scene, or setup")
}

export function sceneSetup(setUpScene: (scene: Scene) => void | Promise<void>) {
    if (__DEV__) throwNoNestedScenes();
    const scene = new Scene();
    _startSetup(scene);
    const returnValue = setUpScene(scene);
    _resolveSetupEnd(scene, returnValue);
    return scene; // for testing convenience
}

export function enscene<A extends any[]>(setUpScene: (scene: Scene, ...args: A) => void | Promise<void>) {
    return (...args: A) => {
        if (__DEV__) throwNoNestedScenes();
        const scene = new Scene();
        _startSetup(scene);
        const returnValue = setUpScene(scene, ...args);
        _resolveSetupEnd(scene, returnValue);
        // return returnValue;
    }
}

function _resolveSetupEnd(scene: Scene, returnValue: any) {
    if (returnValue instanceof Promise) {
        run(async () => {
            const result = await returnValue;
            _endSetup();
            // return result;
        });
    }
    else {
        _endSetup();
    }
}





// const [result, error] = await after(
//     onMouseDown(() => {
//         //do something
//     }, { unlessCanceled: (cancel) => onMounted(cancel) })
// );

// if (error) {
//     throw new Error(error);
// }
// else if (result === 0) {
//     result;
// }



// try {
//     const result = await onMouseDown(() => {
//         //do something
//     }, { unlessCanceled: (cancel) => onMounted(cancel) });

//     if (result === 0) {
//         result;
//     };
// }
// catch (err) {
//     throw new Error(error);
// }

// const pendingMouseOp = onMouseDown(() => {
//     // do soemthing
// }, { unlessCanceled: (cancel) => onMounted(cancel) });

// const [result, error] = await after(pendingMouseOp);


// const reMouseDown = enscene((scene: Scene, event: MouseEvent) => {


// })




// export async function resumeScene<T>(promise: Promise<T>) {
//     if (__DEV__ && !activeScene) {
//         console.warn(
//             `resumeScene cannot be called outside of a scene`
//         )
//     }
//     let res: Awaited<T>;

//     res = await promise;
//     activeScene = this;
//     return res;
//     return promise;
// }





// //USAGE:

// function reMouseDown() {
//     const scene = sceneSetup();
//     onMouseMove(document, () => {
//         // do stuff
//     }, { until: scene.onEnded })

//     onMouseUp(document, () => {
//         // do stuff
//         scene.end();
//     })
// }


// function reMouseDown() {
//     sceneSetup(async (scene) => {
//         onMouseMove(document, () => {
//             // do stuff
//         })

//         const [result, error] = await scene.after(fetch(""))

//         onMouseUp(document, () => {
//             // do stuff
//             scene.end();
//         })
//     });
// }

// function reMouseDown() {
//     sceneSetup((scene) => {
//         onMouseMove(document, () => {
//             // do stuff
//         })

//         onMouseUp(document, () => {
//             // do stuff
//             scene.end();
//         })
//     });
// }