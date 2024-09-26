import { $listen, Callback, ListenerOptions, SustainedTargetedListener } from '@rue/flask';

const listenerMap: Map<string, SustainedTargetedListener> = new Map();

type EventListenerOptions = Omit<AddEventListenerOptions, "signal">

export function useEventListener<
    K extends keyof DocumentEventMap | keyof HTMLElementEventMap | keyof WindowEventMap,
    EVMP extends WindowEventMap & DocumentEventMap & HTMLElementEventMap,
    CB extends (ctx: K extends keyof EVMP ? EVMP[K] : Event) => unknown,
>(eventName: K): SustainedTargetedListener<EventTarget, CB, EventListenerOptions> {
    const listener = listenerMap.get(eventName);
    if (listener) return listener as SustainedTargetedListener<EventTarget, CB>;
    const _listener = ((target: EventTarget, handler: Callback, options?: ListenerOptions & AddEventListenerOptions) => {
        return $listen(handler, options || {}, {
            enroll: (cb) => {
                target.addEventListener(eventName, cb, options);
            },
            remove: (cb) => {
                target.removeEventListener(eventName, cb, options);
            }
        })
    })
    listenerMap.set(eventName, _listener as SustainedTargetedListener);
    return _listener as SustainedTargetedListener<EventTarget, CB>
}