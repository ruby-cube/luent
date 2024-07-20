

type Flask = {
    dispose: () => void;
    onDisposal: (cleanUp: () => void) => void;
}


// Manages flask stack
let activeFlask: NestableFlask | null = null;

function activateFlask(flask: NestableFlask) {
    flask.setOuter(activeFlask);
    activeFlask = flask;
}

function popFlask(flask: NestableFlask) {
    activeFlask = flask.outer;
}

export function getCurrentFlask() {
    return activeFlask;
}

export function onFlaskDisposal(cb: () => void) {
    const flask = getCurrentFlask();
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
    const _flask = new NestableFlask();
    try {
        activateFlask(_flask);
        return run(_flask.o, _flask?.outer?.o || null);
    }
    finally {
        popFlask(_flask);
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
    const _flask = getCurrentFlask();
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









