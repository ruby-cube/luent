<<<<<<< HEAD
import { ActiveListener, Callback, CallbackRemover, ListenerOptions, OneTimeListener, OneTimeTargetedListener, PendingCancelOp, ScheduleCancel, ScheduleRemoval, ScheduleStop, $listen, SustainedListener, SustainedTargetedListener } from '../flask';
=======
import { ActiveListener, Callback, CallbackRemover, ListenerOptions, OneTimeListener, OneTimeTargetedListener, PendingCancelOp, ScheduleCancel, ScheduleRemoval, ScheduleStop, $listen, SustainedListener, SustainedTargetedListener } from '@rue/flask';
>>>>>>> main
import { noop } from '@rue/utils';

const listenerMap: Map<string, SustainedTargetedListener> = new Map();

type EventHandler = EventListener;
type EventListenerOptions = Omit<AddEventListenerOptions, "signal">

export function useEventListener<
    K extends keyof DocumentEventMap | keyof HTMLElementEventMap | keyof WindowEventMap,
    EVMP extends WindowEventMap & DocumentEventMap & HTMLElementEventMap,
    CB extends (ctx: K extends keyof EVMP ? EVMP[K] : Event) => unknown,
>(eventName: K): SustainedTargetedListener<EventTarget, CB, EventListenerOptions> {
    const listener = listenerMap.get(eventName);
    if (listener) return listener as SustainedTargetedListener<EventTarget, CB>;
    const _listener = ((target: EventTarget, handler?: Callback, options?: ListenerOptions & AddEventListenerOptions) => {
        if (handler == null) {
            handler = noop;
            options = { once: true }
        }
        return $listen(handler, options, {
            enroll(handler: EventHandler) {
                target.addEventListener(eventName, handler)
            },
            remove(handler: EventHandler) {
                target.removeEventListener(eventName, handler);
            }
        })
    }) 
    listenerMap.set(eventName, _listener as SustainedTargetedListener);
    return _listener as SustainedTargetedListener<EventTarget, CB>
}
// export function useEventListener<
//     K extends keyof DocumentEventMap | keyof HTMLElementEventMap | keyof WindowEventMap,
//     CFG extends { onceAsDefault?: true },
//     EVMP extends WindowEventMap & DocumentEventMap & HTMLElementEventMap,
//     CB extends (ctx: K extends keyof EVMP ? EVMP[K] : Event) => unknown,
// >(eventName: K, config?: CFG): CFG extends { onceAsDefault: true } ? OneTimeTargetedListener<EventTarget, CB, EventListenerOptions> : SustainedTargetedListener<EventTarget, CB, EventListenerOptions> {
//     const onceAsDefault = config?.onceAsDefault;
//     return ((target: EventTarget, handler: Callback, options?: ListenerOptions & AddEventListenerOptions) => {
//         return $listen(handler, options, {
//             remove(handler: EventHandler) {
//                 target.removeEventListener(eventName, handler);
//             },
//             enroll(handler: EventHandler) {
//                 target.addEventListener(eventName, handler)
//             },
//             onceAsDefault
//         })
//     }) as CFG extends { onceAsDefault: true } ? OneTimeTargetedListener<EventTarget, CB> : SustainedTargetedListener<EventTarget, CB>
// }





