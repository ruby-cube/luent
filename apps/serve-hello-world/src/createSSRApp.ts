import { SSRComponentSetup, TemplateLiteral } from "./lumin.js";
import { makeComponent } from "./makeComponent.js";



export function createSSRApp(App: SSRComponentSetup) {
    const allPromises: Promise<TemplateLiteral>[] = []
    const component = makeComponent(App, undefined, {}, undefined)
    if (component instanceof Promise){
        
    }
    return component;
}


let timedOut: Promise<number>

export function getPendingTimeout(){
    return timedOut;
}

export function startResponseTimer(timeout: number) {
    timedOut = new Promise((resolve) => {
        setTimeout(() => {
            resolve(timeout)
        }, timeout)
    })
}