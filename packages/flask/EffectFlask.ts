
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
    dispose: () => void;
    outer: EffectFlask | null = null;
    onDisposal: (cleanUp: () => void) => { cancel(): void; };

    constructor(public __devName: string) {
        this.outer = getFlask();
        const cleanups: Set<() => void> = new Set()
        let called = false;

        // defining dispose and onDisposal per instances makes it cleaner to 
        // pass them into { until: flask.onDisposal } and flask.onDisposal(outer.dispose)
        // without worrying about `this`

        this.dispose = () => {
            if (called) return;
            called = true;
            for (const cleanUp of cleanups) {
                cleanUp();
            }
        }

        this.onDisposal = (cleanUp: () => void) => {
            cleanups.add(cleanUp);
            return {
                cancel() {
                    cleanups.delete(cleanUp)
                }
            }
        }
    }

    // onDisposal(cleanUp: () => void) {
    //     const cleanups = this.#cleanups;
    //     cleanups.add(cleanUp);
    //     return {
    //         cancel() {
    //             cleanups.delete(cleanUp)
    //         }
    //     }
    // }

    reactivate() {
        pushFlask(this)
    }

    deactivate() {
        if (getFlask() === this)
            popFlask()
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


// export function bindFlask(callback: Callback, flask: EffectFlask | null = getFlask()) {
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
//     outerFlask?.onDisposal(flask.dispose)
// })

// const flask = new EffectFlask(NESTABLE);

// flask.collectEffects((outerFlask) => {

//     outerFlask?.onDisposal(flask.dispose)
// })
// flask.outer.onDisposal(flask.dispose)











