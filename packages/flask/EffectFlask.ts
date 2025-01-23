
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

export function getActiveFlask() {
    return activeFlask;
}

export function onFlaskDiscard(cb: () => void) {
    const flask = getActiveFlask();
    if (!flask) return;
    return flask.onDiscard(cb);
}



export class EffectFlask {
    discard: () => void;
    outer: EffectFlask | null = null;
    onDiscard: (cleanUp: () => void) => { cancel(): void; };

    constructor(public __devName: string) {
        this.outer = getActiveFlask();
        const cleanups: Set<() => void> = new Set()
        let called = false;

        // defining discard and onDiscard per instances makes it cleaner to 
        // pass them into { until: flask.onDiscard } and flask.onDiscard(outer.discard)
        // without worrying about `this`

        this.discard = () => {
            if (called) return;
            called = true;
            for (const cleanUp of cleanups) {
                cleanUp();
            }
        }

        this.onDiscard = (cleanUp: () => void) => {
            cleanups.add(cleanUp);
            return {
                cancel() {
                    cleanups.delete(cleanUp)
                }
            }
        }
    }

    collectEffects<T>(run: (outerFlask: EffectFlask | null) => T) {
        pushFlask(this);
        try {
            return run(this.outer);
        }
        finally {
            popFlask();
        }
    }
}


export function collectEffects<T>(run: (flask: EffectFlask, outerFlask: EffectFlask | null) => T, __devName: string) {
    try{
        const flask = new EffectFlask(__devName);
        pushFlask(flask);
        return run(flask, flask.outer || null);
    }
    catch{
        popFlask();
    }
}


// export function bindFlask(callback: Callback, flask: EffectFlask | null = getActiveFlask()) {
//     if (flask) {
//         function callbackBoundToFlask(...args: any[]) {
//             pushFlask(flask!)
//             const output = callback(...args);
//             popFlask();
//             return output;
//         }
//         return callbackBoundToFlask
//     }
//     return callback;
// }

// USAGE: 
// collectEffects((flask, outerFlask) => {
//     watch($item, () => { /* do something */ })
//     outerFlask?.onDiscard(flask.discard)
// })

// const flask = new EffectFlask(NESTABLE);

// flask.collectEffects((outerFlask) => {

//     outerFlask?.onDiscard(flask.discard)
// })
// flask.outer.onDiscard(flask.discard)