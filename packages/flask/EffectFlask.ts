
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
    #cleanups: Set<() => void>;
    dispose: () => void;
    outer: EffectFlask | null = null;

    constructor(public __devName: string) {
        this.outer = getFlask();
        const cleanups: Set<() => void> = new Set()
        this.#cleanups = cleanups
        let called = false;
        this.dispose = () => {
            if (called) return;
            called = true;
            for (const cleanUp of cleanups) {
                cleanUp();
            }
        }
    }

    onDisposal(cleanUp: () => void) {
        const devName = this.__devName
        console.trace('adding cleanup', this.__devName)
        const cleanups = this.#cleanups;
        cleanups.add(cleanUp);
        // return new PendingFlaskCleanup(cleanups, cleanUp)
        return {
            cancel() {
                console.trace('cancel cleanup', devName)
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

    collectEffects<T>(run: (outerFlask: EffectFlask | null) => T) {
        try {
            pushFlask(this);
            return run(this.outer);
        } finally {
            popFlask();

        }
    }
}




export function collectEffects<T>(run: (flask: EffectFlask, outerFlask: EffectFlask | null) => T, __devName: string) {
    const flask = new EffectFlask(__devName);
    try {
        pushFlask(flask);
        return run(flask, flask.outer || null);
    } finally {
        popFlask();
    }
}


export function bindFlask(callback: Callback, flask: EffectFlask | null = null) {
    if (flask) {
        function callbackBoundToFlask(...args: any[]) {
            pushFlask(flask!)
            callback(...args);
            popFlask();
        }
        return callbackBoundToFlask
    } 
    return callback;
}

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











