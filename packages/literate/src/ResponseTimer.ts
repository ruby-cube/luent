import { fromApp,  provide, TypedKey } from "@rue/lumo";


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

export const RESPONSE_TIMER = Symbol('responseTimer') as TypedKey<ResponseTimer>


export function getResponseTimer(){
    return fromApp(RESPONSE_TIMER)
}

