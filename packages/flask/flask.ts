import { Callback } from "./flaskedListeners";


type Flask = {
    dispose: () => void;
    onDisposal: (cleanUp: () => void) => void;
}


// Manages flask stack
let activeFlask: NestableFlask | null = null;
let previousFlask: NestableFlask | null = null;

function pushFlask(flask: NestableFlask) {
    // flask.setOuter(activeFlask);
    previousFlask = activeFlask;
    activeFlask = flask;
}

function popFlask() {
    activeFlask = previousFlask;
}

export function getActiveFlask() {
    return activeFlask;
}

export function onFlaskDisposal(cb: () => void) {
    const flask = getActiveFlask();
    if (!flask) return;
    flask.o.onDisposal(cb);
}


class NestableFlask {
    o: Flask = createFlask(this);
    outer: NestableFlask | null = null
    setOuter(flask: NestableFlask | null) {
        this.outer = flask;
    }
    cleanups: Set<() => void> = new Set()
}


function createFlask(_flask: NestableFlask) {

    function dispose() {
        const cleanups = _flask.cleanups;
        for (const cleanUp of cleanups) {
            cleanUp();
        }
    }

    function onDisposal(cleanUp: () => void) {
        _flask.cleanups.add(cleanUp); //TODO: do cleanUps need to be removed?
    }

    return {
        dispose,
        onDisposal
    }
}

export function collectEffects(run: (flask: Flask, outerFlask: Flask | null) => any) {
    const outerFlask = getActiveFlask();
    const _flask = new NestableFlask();
    try {
        pushFlask(_flask);
        return run(_flask.o, outerFlask?.o || null);
    }
    finally {
        popFlask();
    }
}


export function bindFlask(callback: Callback){
    const flask = getActiveFlask()!;
    return (...args: any[])=>{
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









