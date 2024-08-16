import { Callback } from "./flaskableListeners";


export type Flask = {
    dispose: () => void;
    readonly outer?: Flask;
    onDisposal: (cleanUp: () => void) => void;
    collectEffects: <T>(run: (outerFlask: Flask | null) => T) => T;
}


// Manages flask stack
let activeFlask: NestableFlask | null = null;
let previousFlask: NestableFlask | null = null;

function pushFlask(flask: NestableFlask) {
    if (activeFlask)flask.setOuter(activeFlask);
    previousFlask = activeFlask;
    activeFlask = flask;
}

function popFlask() {
    activeFlask = previousFlask;
    previousFlask = null;
}

// INTERNAL
export function getActiveFlask() {
    return activeFlask;
}

// PUBLIC
export function getFlask() {
    return activeFlask?.o;
}

export function onFlaskDisposal(cb: () => void) {
    const flask = getActiveFlask();
    if (!flask) return;
    flask.o.onDisposal(cb);
}



class NestableFlask {
    o: Flask = createFlask(this)
    outer: NestableFlask | null = null
    setOuter(flask: NestableFlask | null) {
        this.outer = flask;
        //@ts-expect-error setting read-only
        this.o.outer = flask?.o;
    }
    cleanups: Set<() => void> = new Set()

    constructor(public __devName: string) { }
}


function createFlask(_flask: NestableFlask) {
    return {
        dispose() {
            // console.trace("disposing flask")
            const cleanups = _flask.cleanups;
            for (const cleanUp of cleanups) {
                cleanUp();
            }
        },

        outer: _flask.outer?.o,

        onDisposal(cleanUp: () => void) {
            _flask.cleanups.add(cleanUp); //TODO: do cleanUps need to be removed?
        },

        collectEffects(run: (outerFlask: Flask | null) => any) {
            const outerFlask = getActiveFlask();
            try {
                pushFlask(_flask);
                return run(outerFlask?.o || null);
            }
            finally {
                popFlask();
            }
        }
    };
}

export function collectEffects<T>(run: (flask: Flask, outerFlask: Flask | null) => T, __devName: string) {
    const outerFlask = getActiveFlask();
    const _flask = new NestableFlask(__devName);
    try {
        pushFlask(_flask);
        return run(_flask.o, outerFlask?.o || null);
    }
    finally {
        popFlask();
    }
}


export function bindFlask(callback: Callback) {
    const flask = getActiveFlask()!;
    return (...args: any[]) => {
        pushFlask(flask)
        callback(...args);
        popFlask();
    }
}

// USAGE: 
// collectEffects((flask, outerFlask) => {
//     watch($item, ()=>{ /* do something */ })
//     outerFlask?.onDisposal(flask.dispose)
// })



/* 
INTERNAL 
*/
export function addToFlask(cleanup: () => void) {
    const _flask = getActiveFlask();
    _flask?.cleanups.add(cleanup)
}


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









