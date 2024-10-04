import { $listen, ListenerOptions, ScheduleStop } from '@rue/flask';
import { PendingCancelOp } from '../../../flask/PendingCancelOp';


type EventListenerOptions = Omit<AddEventListenerOptions, "signal"> & Omit<ListenerOptions, 'until'> & {
    until?: [EventTarget, keyof DocumentEventMap | keyof HTMLElementEventMap | keyof WindowEventMap] | ScheduleStop
}

type EventName<T> = T extends Document ? keyof DocumentEventMap :
    T extends Window ? keyof DocumentEventMap :
    keyof HTMLElementEventMap

type EventHandler<T, K extends string> = T extends Document ? (event: K extends keyof DocumentEventMap ? DocumentEventMap[K] : Event) => void
    : T extends Window ? (event: K extends keyof WindowEventMap ? WindowEventMap[K] : Event) => void
    : T extends HTMLElement ? (event: K extends keyof HTMLElementEventMap ? HTMLElementEventMap[K] : Event) => void
    : EventListener

export function listen<
    T extends EventTarget
>(
    element: T,
    event: EventName<T>,
    handler: EventHandler<T, EventName<T>>,
    options?: EventListenerOptions
) {
    const until = options?.until
    if (until instanceof Array) {
        const eventName = until[1]
        if (typeof eventName !== 'string') {
            throw new Error(`${eventName} is an invalid event name. Listener will not be registered.`)
        }
        options!.until = (cleanup) => listen(until[0], <keyof HTMLElementEventMap>until[1], cleanup) as unknown as PendingCancelOp
    }

    return $listen(handler, <ListenerOptions>options || {}, {
        enroll(cb) {
            element.addEventListener(event, cb, options)
        },
        remove(cb) {
            element.removeEventListener(event, cb, options)
        }
    })
}
