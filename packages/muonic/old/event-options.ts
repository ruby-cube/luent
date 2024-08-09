
// type EventOptions = {
//     capture?: true;
//     once?: true;
//     preventDefault?: true;
//     passive?: false
// }

// type HandlerWithOptions = {
//     (...args: any[]): void,
//     options: EventOptions
// }

// type Capture = {
//     once: Capture_Once
//     preventDefault: Prevent_Capture
// }
// type Once = {
//     capture: Capture_Once
//     preventDefault: Once_Prevent
// }
// type Prevent = {
//     once: Once_Prevent
//     capture: Prevent_Capture
// }

// type Capture_Once = {
//     preventDefault: typeof once_prevent_capture
// }

// type Once_Prevent = {
//     capture: typeof once_prevent_capture
// }

// type Prevent_Capture = {
//     once: typeof once_prevent_capture
// }


// type Eh = keyof CallableFunction

// const capture = _capture as unknown as Capture 
// // & Omit<typeof _capture, 'apply' | 'bind' | 'call'>


// const once = _once as Once & typeof _once
// export const preventDefault = _prevent as Prevent & typeof _prevent


// capture.once = capture_once as Capture_Once & typeof capture_once
// capture.preventDefault = prevent_capture as Prevent_Capture & typeof prevent_capture
// once.capture = capture_once as Capture_Once & typeof capture_once
// once.preventDefault = once_prevent as Once_Prevent & typeof once_prevent
// preventDefault.capture = prevent_capture as Prevent_Capture & typeof prevent_capture
// preventDefault.once = once_prevent as Once_Prevent & typeof once_prevent
// capture.once.preventDefault = once_prevent_capture
// once.preventDefault.capture = once_prevent_capture
// preventDefault.capture.once = once_prevent_capture
// capture.preventDefault.once = once_prevent_capture
// once.capture.preventDefault = once_prevent_capture
// preventDefault.once.capture = once_prevent_capture

// function _capture<T extends Function>(handler: T) {
//     (<HandlerWithOptions><unknown>handler).options = {
//         capture: true
//     };
//     return handler
// }


// function _once<T extends Function>(handler: T) {
//     (<HandlerWithOptions><unknown>handler).options = {
//         once: true
//     };
//     return handler
// }


// function _prevent<T extends (e: Event) => void>(handler: T) {
//     (<HandlerWithOptions><unknown>handler).options = {
//         passive: false
//     };
//     return (e: Parameters<T>[0]) => {
//         e.preventDefault();
//         handler(e)
//     }
// }


// function capture_once<T extends Function>(handler: T) {
//     (<HandlerWithOptions><unknown>handler).options = {
//         capture: true,
//         once: true
//     };
//     return handler
// }

// function prevent_capture<T extends (e: Event) => void>(handler: T) {
//     (<HandlerWithOptions><unknown>handler).options = {
//         capture: true,
//         passive: false
//     };
//     return (e: Parameters<T>[0]) => {
//         e.preventDefault();
//         handler(e)
//     }
// }

// function once_prevent<T extends (e: Event) => void>(handler: T) {
//     (<HandlerWithOptions><unknown>handler).options = {
//         once: true,
//         passive: false
//     };
//     return (e: Parameters<T>[0]) => {
//         e.preventDefault();
//         handler(e)
//     }
// }


// function once_prevent_capture<T extends (e: Event) => void>(handler: T) {
//     (<HandlerWithOptions><unknown>handler).options = {
//         once: true,
//         capture: true,
//         passive: false
//     };
//     return (e: Parameters<T>[0]) => {
//         e.preventDefault();
//         handler(e)
//     }
// }

// const ONCE_AND_CAPTURE = {
//     once: true,
//     capture: true,
// } as const

// export const ONCE = {
//     CAPTURE: ONCE_AND_CAPTURE,
//     once: true
// } as const

// export const CAPTURE = {
//     ONCE: ONCE_AND_CAPTURE,
//     capture: true
// } as const







const targetThis_preventDefault_stopPropagation = {
    TARGET_THIS: true,
    PREVENT_DEFAULT: true,
    STOP_PROPAGATION: true
} as const

const targetThis_preventDefault_endHere = {
    TARGET_THIS: true,
    PREVENT_DEFAULT: true,
    END_HERE: true
} as const


const targetThis_preventDefault = {
    stopPropagation: targetThis_preventDefault_stopPropagation,
    endHere: targetThis_preventDefault_endHere,
    PREVENT_DEFAULT: true,
    TARGET_THIS: true
} as const

const targetThis_stopPropagation = {
    TARGET_THIS: true,
    STOP_PROPAGATION: true
} as const

const targetThis_endHere = {
    TARGET_THIS: true,
    END_HERE: true
} as const

const preventDefault_stopPropagation = {
    PREVENT_DEFAULT: true,
    STOP_PROPAGATION: true
} as const

const preventDefault_endHere = {
    PREVENT_DEFAULT: true,
    END_HERE: true
} as const

export const targetThis = {
    preventDefault: targetThis_preventDefault,
    stopPropagation: targetThis_stopPropagation,
    endHere: targetThis_endHere,
    TARGET_THIS: true
} as const

export const preventDefault = {
    stopPropagation: preventDefault_stopPropagation,
    endHere: preventDefault_endHere,
    PREVENT_DEFAULT: true,
} as const

export const stopPropagation = {
    STOP_PROPAGATION: true
} as const

export const endHere = {
    END_HERE: true
} as const


