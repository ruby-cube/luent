//-@ts-nocheck
import { $schedule, Callback, Callbacks, markSceneSetup, OneTimeListener, ScheduledOp, SchedulerOptions } from './planify';
import { defineSceneCleanup } from './scheduleAutoCleanup';
import { noop } from "@rue/utils";

export type Scene = {
    end: () => void;
    onEnded: SceneEndListener
}

export type SceneEndListener = (handler?: Callback, options?: SchedulerOptions)=> ScheduledOp<Callback>;

export const UNATTACHED = true;


export function beginScene(setUpScene?: (scene: Scene) => void, unattached: boolean = false) {
    const handlers = new Set() as Callbacks;

    function onEnded(handler?: Callback, options?: SchedulerOptions) {
        if (handler == null) {
            handler = noop;
        }
        return $schedule(handler, options, {
            enroll: (handler) => {
                handlers.add(handler)
            },
            remove: (handler) => {
                handlers.delete(handler)
            }
        })
    }

    function end() {
        for (const cb of handlers) {
            cb()
        }
    }

    const scene = { end, onEnded }
    defineSceneCleanup(onEnded);

    if (setUpScene) {
        markSceneSetup(true, unattached);
        setUpScene(scene);
        markSceneSetup(false, unattached);
    }
    return scene;
}

export function defineScene<CB extends (context: any, scene: Scene) => any>(cb: CB) {
    return (context: Parameters<CB>[0]) => {
        beginScene((scene) => {
            cb(context, scene);
        })
    }
}


const reMouse = defineScene((event: MouseEvent, scene) => {


})


// //USAGE:

// function reMouseDown() {
//     const scene = beginScene();
//     onMouseMove(document, () => {
//         // do stuff
//     }, { until: scene.onEnded })

//     onMouseUp(document, () => {
//         // do stuff
//         scene.end();
//     })
// }

// function reMouseDown() {
//     const scene =
//         beginScene(() => {
//             onMouseMove(document, () => {
//                 // do stuff
//             })

//             onMouseUp(document, () => {
//                 // do stuff
//                 scene.end();
//             })
//         });

// }

// function reMouseDown() {
//     beginScene((scene) => {
//         onMouseMove(document, () => {
//             // do stuff
//         })

//         onMouseUp(document, () => {
//             // do stuff
//             scene.end();
//         })
//     });
// }