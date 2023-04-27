import "setimmediate"
import { Callback, $schedule, SchedulerOptions } from "../flask";

//NOTE:
// There is no microtask queue during nextRender phase. Any microtasks scheduled within a beforeScreenPaint cb will be run synchronously.
// vue's nextTick callbacks run after any cbs added to the microtask queue during synchronous calls.
//
// Invocation Order
// [original handler/task][update components][ps][nextTick][nested PS] --- [task] (or [beforeScreenPaint] if ready)
// render: [style] [queued js via rAF] [paint] //QUESTION: I'm still not clear if [calc style] happens before or after rAF cb. I don't know if vue is causing style to recalc earlier than necessary



export const addPS = queueMicrotask;

export function queueTask<CB extends Callback>(callback: CB, options?: SchedulerOptions) {
    return $schedule(callback, options, { enroll: setImmediate, remove: clearImmediate });
}
export function beforeScreenPaint<CB extends Callback>(callback: CB, options?: SchedulerOptions) { //TODO: These should be usable as CancelSchedulers
    return $schedule(callback, options, { enroll: requestAnimationFrame, remove: cancelAnimationFrame });
}
export function onTimeout<CB extends Callback>(delay: number, callback: CB, options?: SchedulerOptions) {
    return $schedule(callback, options, { enroll: (cb) => setTimeout(cb, delay), remove: clearTimeout })
}



export const thread = {
    queueTask,
    beforeScreenPaint,
    addPS
}


// USAGE

if (__DOCU__) {
    addPS(() => {
        // code that will run after the original task/handlers 
        // and previously queued microtasks finish running
        // and before the next event loop task
    })

    queueTask(() => {
        // code that will run after any previously 
        // queued tasks/events in the event loop
    })

    beforeScreenPaint(() => {
        // code that will after any previously queued rAF callbacks
        // and before the next screen paint
    })

    onTimeout(500, () => {
        // code that will run after 500ms
    })
}





