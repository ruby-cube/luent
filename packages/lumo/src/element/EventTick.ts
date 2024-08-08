import { $listen, ActiveListener, ListenerOptions, PendingOp } from "@rue/flask";

const eventTickMap: WeakMap<EventTarget, Map<string, EventTick>> = new WeakMap();

export function useEventTick(target: EventTarget, event: string, afterEventHandler: (...args: any[]) => void) {
    let eventMap = eventTickMap.get(target);
    if (!eventMap) {
        eventMap = new Map();
        eventTickMap.set(target, eventMap);
    }
    let eventTick = eventMap.get(event);
    if (!eventTick) {
        eventTick = new EventTick(target, event, afterEventHandler)
        eventMap.set(event, eventTick);
    }
    return eventTick;
}

// The after event listener runs one final handler after all other tasks for the event has been completed
export class EventTick {
    handlerCount = 0;
    prevHandlerCount = 0;
    afterEventListener: ActiveListener | undefined;

    constructor(
        public node: EventTarget,
        public event: string,
        public afterEventHandler: (...args: any[]) => void
    ) { }

    updateHandlers(attachOrRemoveHandlers: () => void) {
        this.prevHandlerCount = this.handlerCount;
        attachOrRemoveHandlers();
        if (this.prevHandlerCount > 0 && this.handlerCount === 0) {
            this.afterEventListener?.stop();
        }
        else if (this.prevHandlerCount === 0 && this.handlerCount > 0) {
            this.afterEventListener = this.attachHandler(this._afterEventHandler = (e: Event) => afterEventHandler(this, e), {});
        }
    }


    attachHandler(handler: EventListener, options: ListenerOptions & AddEventListenerOptions) {
        if (handler === this._afterEventHandler) {
            return $listen(handler, options, {
                enroll: (cb) => {
                    this.node.addEventListener(this.event, cb, options);
                },
                remove: (cb) => {
                    this.node.removeEventListener(this.event, cb, options);
                }
            })
        }
        else {
            const _handler = (e: Event) => {
                handler(createLumoEvent(e));
            }
            return $listen(_handler, options, {
                enroll: (cb) => {
                    this.handlerCount++;
                    this.node.addEventListener(this.event, cb, options);
                },
                remove: (cb) => {
                    this.handlerCount--;
                    this.node.removeEventListener(this.event, cb, options);
                }
            })
        }
    }

    // removeHandler(handler: EventListener) {
    // }

    finalHandlerAdded = false;

    _afterEventHandler: ((e: Event) => void) | undefined
}

function afterEventHandler(tick: EventTick, e: Event) {
    const { afterEventHandler, event } = tick
    if (
        e.bubbles === false ||
        (<Event & { propagationStopped: boolean }>e).propagationStopped
    ) {
        afterEventHandler(e); // the final event tick handler
    }
    if (tick.finalHandlerAdded === true) {
        return;
    }
    else {
        tick.finalHandlerAdded = true;
        document.addEventListener(event, () => {
            afterEventHandler(e); // the final event tick handler
            tick.finalHandlerAdded = false; // reset for next event tick
        }, { once: true });
    }
}

function createLumoEvent(e: Event) {
    return new Proxy(e, lumoEventTraps) as Event & { propagationStopped: boolean }
}

const lumoEventTraps = {
    get(target: Event, key: keyof Event | 'propagationStopped', receiver: Event) {
        let propagationStopped = false;
        if (key === 'stopPropagation') {
            return () => {
                propagationStopped = true;
                target.stopPropagation()
            };
        }
        else if (key === 'propagationStopped') {
            return propagationStopped;
        }
        else {
            return target[key];
            return Reflect.get(target, key, receiver);
        }
    }
}

// Event Flow or Scene, do I need event tick for these cases?
// function reMouseDown(e) {
//     beginScene((scene) => {

//         onMouseMove(document, () => {

//         })



//     })
// }