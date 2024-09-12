import { Callback, $schedule, SchedulerOptions } from "@rue/flask";
import {setImmediate, clearImmediate} from "./setImmediate"

//NOTE:
// There is no microtask queue during nextRender phase. Any microtasks scheduled within a beforeRepaint cb will be run synchronously.
// vue's nextTick callbacks run after any cbs added to the microtask queue during synchronous calls.
//
// Invocation Order
// [original handler/task][update components][ps][nextTick][nested PS] --- [task] (or [beforeRepaint] if ready)
// render: [style] [queued js via rAF] [paint] //QUESTION: I'm still not clear if [calc style] happens before or after rAF cb. I don't know if vue is causing style to recalc earlier than necessary



export const queuePS = queueMicrotask;

export function queueTask<CB extends Callback>(callback: CB, options?: SchedulerOptions) {
    return $schedule(callback, options, { enroll: setImmediate, remove: clearImmediate });
}
export function beforeRepaint<CB extends FrameRequestCallback>(callback: CB, options?: SchedulerOptions) { //TODO: These should be usable as CancelSchedulers
    return $schedule(callback, options, { enroll: requestAnimationFrame, remove: cancelAnimationFrame });
}
export function onTimeout<CB extends Callback>(delay: number, callback: CB, options?: SchedulerOptions, ...args: any[]) {
    return $schedule(callback, options, { enroll: (cb) => setTimeout(cb, delay, ...args), remove: clearTimeout })
}



export const thread = {
    queueTask,
    beforeRepaint,
    queuePS
}


// USAGE

if (__DOCU__) {
    queuePS(() => {
        // code that will run after the original task/handlers 
        // and previously queued microtasks finish running
        // and before the next event loop task
    })

    queueTask(() => {
        // code that will run after any previously 
        // queued tasks/events in the event loop
    })

    beforeRepaint(() => {
        // code that will after any previously queued rAF callbacks
        // and before the next screen paint
    })

    onTimeout(500, () => {
        // code that will run after 500ms
    })
}





