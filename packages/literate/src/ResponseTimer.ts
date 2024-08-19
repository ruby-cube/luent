import { getAppWideResource, provide, SymbolKey } from "@rue/lumo";

// const GET_PENDING_TIMEOUT = Symbol() as SymbolKey<() => Promise<number>>
// const START_RESPONSE_TIMER = Symbol() as SymbolKey<(timeout: number) => void>

export class ResponseTimer {
    pendingTimeout: Promise<number>;

    constructor(timeout: number) {
        this.pendingTimeout = new Promise((resolve) => {
            setTimeout(() => {
                resolve(timeout)
            }, timeout)
        })
    }
}


// const RESPONSE_TIMER_NOT_INITIALIZED = "Response timer has not been initialized. Make sure initializeResponseTimer has been called in makeRootComponent"

// export function getPendingTimeout(){
//     return getAppWideResource(GET_PENDING_TIMEOUT, RESPONSE_TIMER_NOT_INITIALIZED)()
// }

// export function startResponseTimer(timeout: number){
//     return getAppWideResource(START_RESPONSE_TIMER, RESPONSE_TIMER_NOT_INITIALIZED)(timeout)
// }