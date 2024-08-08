import { EventTick } from "./EventTick";

export function thisAlone<T extends (e: Event) => void>(handler: T) {
    return (element: HTMLElement, e: Parameters<T>[0]) => {
        if (e.target !== element) return;
        handler(e)
    }
}

export function stopPropagation<T extends (e: Event) => void>(handler: T) { //TODO: Make sure this works properly with EventTick
    return (e: Parameters<T>[0]) => {
        e.stopPropagation()
        handler(e)
    }
}

export function endEvent<T extends (e: Event) => void>(handler: T) { //TODO: Make sure this works properly with EventTick
    return (eventTick: EventTick, e: Parameters<T>[0]) => {
        e.stopImmediatePropagation();
        handler(e)
        const afterEventHandler = eventTick._afterEventHandler || ((e) => eventTick.afterEventHandler(eventTick, e))
        eventTick.attachHandler(eventTick._afterEventHandler!, {})
    }
}

export function preventDefault<T extends (e: Event) => void>(handler: T) {
    return (e: Parameters<T>[0]) => {
        e.preventDefault();
        handler(e)
    }
}
