
type EventOptions = {
    capture?: true,
    once?: true,
    passive?: true
}

type HandlerWithOptions = {
    (...args: any[]): void,
    options: EventOptions
}

type Capture = {
    once: Capture_Once
    passive: Passive_Capture
}
type Once = {
    capture: Capture_Once
    passive: Once_Passive
}
type Passive = {
    once: Once_Passive
    capture: Passive_Capture
}

type Capture_Once = {
    passive: typeof once_passive_capture
}

type Once_Passive = {
    capture: typeof once_passive_capture
}

type Passive_Capture = {
    once: typeof once_passive_capture
}


export const capture = _capture as Capture & typeof _capture
export const once = _once as Once & typeof _once
export const allowDefault = _passive as Passive & typeof _passive

capture.once = capture_once as Capture_Once & typeof capture_once
capture.passive = passive_capture as Passive_Capture & typeof passive_capture
once.capture = capture_once as Capture_Once & typeof capture_once
once.passive = once_passive as Once_Passive & typeof once_passive
allowDefault.capture = passive_capture as Passive_Capture & typeof passive_capture
allowDefault.once = once_passive as Once_Passive & typeof once_passive
capture.once.passive = once_passive_capture
once.passive.capture = once_passive_capture
allowDefault.capture.once = once_passive_capture
capture.passive.once = once_passive_capture
once.capture.passive = once_passive_capture
allowDefault.once.capture = once_passive_capture

function _capture<T extends Function>(handler: T) {
    (<HandlerWithOptions><unknown>handler).options = {
        capture: true
    };
    return handler
}


function _once<T extends Function>(handler: T) {
    (<HandlerWithOptions><unknown>handler).options = {
        once: true
    };
    return handler
}


function _passive<T extends Function>(handler: T) {
    (<HandlerWithOptions><unknown>handler).options = {
        passive: true
    };
    return handler
}


function capture_once<T extends Function>(handler: T) {
    (<HandlerWithOptions><unknown>handler).options = {
        capture: true,
        once: true
    };
    return handler
}

function passive_capture<T extends Function>(handler: T) {
    (<HandlerWithOptions><unknown>handler).options = {
        capture: true,
        passive: true
    };
    return handler
}

function once_passive<T extends Function>(handler: T) {
    (<HandlerWithOptions><unknown>handler).options = {
        once: true,
        passive: true
    };
    return handler
}


function once_passive_capture<T extends Function>(handler: T) {
    (<HandlerWithOptions><unknown>handler).options = {
        once: true,
        passive: true,
        capture: true
    };
    return handler
}






