//-@ts-nocheck
import { $schedule, Callback, Callbacks, markSceneSetup, OneTimeListener, ScheduledOp, SchedulerOptions } from './flaskedListeners';
import { noop, run } from "@rue/utils";
import { registerSceneCleanup } from './scheduleSceneCleanup';
import { RootFlask } from './RootFlasks';
import { _getRootFlask } from './flask';

// export type Scene = {
//     end: () => void;
//     onEnded: SceneEndListener;
//     resume: ()=>void;
// }

export class Scene {
    outerScene: Scene | null | undefined;
    private endHandlers: Callbacks = new Set();

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


function _startSetup(scene: Scene) {
    scene.outerScene = activeSceneSetup;
    activeSceneSetup = scene;
    registerSceneCleanup(scene);
    markSceneSetup(true);
}

function _endSetup(scene: Scene) {
    activeSceneSetup = scene.outerScene;
    scene.outerScene = scene.outerScene?.outerScene;
    registerSceneCleanup(activeSceneSetup);
    markSceneSetup(!!activeSceneSetup || false);
}

// export type SceneEndListener = (handler?: Callback, options?: SchedulerOptions)=> ScheduledOp<Callback>;

// export const UNATTACHED = true;

let activeSceneSetup: Scene | null | undefined;

export function getScene() {
    return activeSceneSetup;
}

export function inSceneSetup() {
    return Boolean(activeSceneSetup);
}

export function sceneSetup(setUpScene: (scene: Scene) => void | Promise<void>) {
    const scene = new Scene();
    _startSetup(scene);
    const returnValue = setUpScene(scene);
    _resolveSetupEnd(scene, returnValue);
    return scene;
}

export function scenify<A extends any[]>(setUpScene: (scene: Scene, ...args: A) => void | Promise<void>) {
    return (...args: A) => {
        const scene = new Scene();
        _startSetup(scene);
        const returnValue = setUpScene(scene, ...args);
        _resolveSetupEnd(scene, returnValue);
    }
}

function _resolveSetupEnd(scene: Scene, returnValue: any) {
    if (returnValue instanceof Promise) {
        run(async () => {
            await returnValue;
            _endSetup(scene);
        });
    }
    else {
        _endSetup(scene);
    }
}

// const reMouseDown = scenify((scene: Scene, event: MouseEvent) => {


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



export function defineScene<CB extends (context: any, scene: Scene) => any>(cb: CB) {
    return (context: Parameters<CB>[0]) => {
        sceneSetup((scene) => {
            cb(context, scene);
        })
    }
}


const reMouse = defineScene((event: MouseEvent, scene) => {


})


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