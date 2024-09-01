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

    constructor(public outer: EffectFlask | null, public __devName: string) {
        this.outer = outer;
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
        console.trace('adding cleanup')
        const cleanups = this.#cleanups;
        cleanups.add(cleanUp);
        return {
            cancel() {
                console.trace('cancel cleanup')
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


export function bindFlask(callback: Callback, flask: EffectFlask | null = getFlask()) {
    if (flask) return (...args: any[]) => {
        pushFlask(flask)
        callback(...args);
        popFlask();
    }
    return callback;
}

// USAGE: 
// collectEffects((flask, outerFlask) => {
//     watch($item, ()=>{ /* do something */ })
//     outerFlask?.onDisposal(flask.dispose)
// })











