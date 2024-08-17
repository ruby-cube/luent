import { Callback } from "./flaskableListeners";

// Manages flask stack
let activeFlask: EffectFlask | null = null;
let previousFlask: EffectFlask | null = null;

export function pushFlask(flask: EffectFlask) {
    if (!flask.__devName) console.trace("Flask does not have a dev name!")
    previousFlask = activeFlask;
    activeFlask = flask;
}

export function popFlask() {
    activeFlask = previousFlask;
    previousFlask = previousFlask?.outer || null;
}

export function getFlask() {
    return activeFlask;
}

export function onFlaskDisposal(cb: () => void) {
    const flask = getFlask();
    if (!flask) return;
    return flask.onDisposal(cb);
}



export class EffectFlask {
    #cleanups: Set<() => void> = new Set()

    constructor(public outer: EffectFlask | null, public __devName: string) {
        this.outer = outer;
    }

    dispose() {
        const cleanups = this.#cleanups;
        for (const cleanUp of cleanups) {
            cleanUp();
        }
    }

    onDisposal(cleanUp: () => void) {
        const cleanups = this.#cleanups;
        cleanups.add(cleanUp); //TODO: do cleanUps need to be removed?
        return {
            cancel(){
                cleanups.delete(cleanUp)
            }
        }
    }

    reactivate() {
        pushFlask(this)
    }

    deactivate() {
        if (getFlask() === this)
            popFlask()
    }
}


export function collectEffects<T>(run: (flask: EffectFlask, outerFlask: EffectFlask | null) => T, __devName: string) {
    const outerFlask = getFlask();
    const _flask = new EffectFlask(outerFlask, __devName);
    try {
        pushFlask(_flask);
        return run(_flask, outerFlask || null);
    } finally {
        popFlask();

    }
}


export function bindFlask(callback: Callback) {
    const flask = getFlask()!;
    return (...args: any[]) => {
        if (flask) pushFlask(flask)
        callback(...args);
        if (flask) popFlask();
    }
}

// USAGE: 
// collectEffects((flask, outerFlask) => {
//     watch($item, ()=>{ /* do something */ })
//     outerFlask?.onDisposal(flask.dispose)
// })



// /* 
// INTERNAL 
// */
// export function addToFlask(cleanup: () => void) {
//     const _flask = getActiveFlask();
//     _flask?.#cleanups.add(cleanup)
// }

// USAGE:
//
// function makeActiveListener() {
//     addToFlask(activeListener.stop);
//
//     const activeListener = {
//         stop() {
//             // remove effect from effects queue
//         }
//     }
//     return activeListener
// }









