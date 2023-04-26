//-@ts-nocheck
import { $schedule, Callback, Callbacks, markSceneSetup, OneTimeListener, ScheduledOp, SchedulerOptions } from './planify';
import { noop, run } from "@rue/utils";
import { registerSceneCleanup } from './scheduleSceneCleanup';

// export type Scene = {
//     end: () => void;
//     onEnded: SceneEndListener;
//     resume: ()=>void;
// }

export class Scene {
    outerScene: Scene | null |undefined
    private endHandlers: Callbacks = new Set();
    constructor(setUpScene: ((scene: Scene) => void | Promise<void>) | undefined) {
        registerSceneCleanup(this);

        if (setUpScene) {
            run(async () => {
                this._start();
                await setUpScene(this);
                this._end();
            })
        }
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
    _start() {
        this.outerScene = activeSceneSetup;
        activeSceneSetup = this;
        markSceneSetup(true);
    }

    _end() {
        this.outerScene = this.outerScene?.outerScene;
        activeSceneSetup = this.outerScene;
        markSceneSetup(false);
    }

    async after<T>(promise: Promise<T>) {
        if (__DEV__ && activeSceneSetup !== this) {
            throw new Error(`scene.after() called outside of scene setup.`)
        }
        this._end();
        try {
            const result = await promise
            return [result, null]
        }
        catch (err) {
            return [null, err]
        }
        finally {
            this._start();
        }
    }
}

// export type SceneEndListener = (handler?: Callback, options?: SchedulerOptions)=> ScheduledOp<Callback>;

// export const UNATTACHED = true;

let activeSceneSetup: Scene | null | undefined;

export function getActiveScene(){
    return activeSceneSetup;
}

export function sceneSetup(setUpScene: (scene: Scene) => void | Promise<void>) {
    // const handlers = new Set() as Callbacks;

    // function onEnded(handler?: Callback, options?: SchedulerOptions) {
    //     if (handler == null) {
    //         handler = noop;
    //     }
    //     return $schedule(handler, options, {
    //         enroll: (handler) => {
    //             handlers.add(handler)
    //         },
    //         remove: (handler) => {
    //             handlers.delete(handler)
    //         }
    //     })
    // }

    // if (__TEST__){
    //     onEnded.handlers = handlers
    // }

    // function end() {
    //     for (const cb of handlers) {
    //         cb()
    //     }
    // }

    return new Scene(setUpScene);

}



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


function reMouseDown() {
    sceneSetup(async (scene) => {
        onMouseMove(document, () => {
            // do stuff
        })

        const [result, error] = await scene.after(fetch(""))

        onMouseUp(document, () => {
            // do stuff
            scene.end();
        })
    });
}

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