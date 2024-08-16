import { Callback } from "./flaskableListeners";


export type Flask = {
    dispose: () => void;
    readonly outer?: Flask;
    onDisposal: (cleanUp: () => void) => void;
    collectEffects: <T>(run: (outerFlask: Flask | null) => T) => T;
    reactivate: () => void;
    deactivate: () => void;
}


// Manages flask stack
let activeFlask: NestableFlask | null = null;
let previousFlask: NestableFlask | null = null;
const flaskStack: NestableFlask[] = [];

export function pushFlask(flask: NestableFlask) {
    if (!flask.__devName) console.trace()
    console.log("push flask", flask ? flask.__devName : "NO FLASK")
    // const outer = flaskStack.at(-1);
    // if (outer) flask.setOuter(outer)
    // if (activeFlask)flask.setOuter(activeFlask);
    // previousFlask = activeFlask;
    // activeFlask = flask;
    flaskStack.push(flask)
}

export function popFlask() {
    // const outer = activeFlask!.outer;
    // activeFlask = previousFlask;
    // previousFlask = outer;
    const outer = flaskStack.pop();
    console.log("pop", outer ? outer.__devName : "NO FLASK", "-->", flaskStack.at(-1) ? flaskStack.at(-1)!.__devName : "NO FLASK")
}

// INTERNAL
export function getActiveFlask() {
    return flaskStack.at(-1) || null
    return activeFlask;
}

// PUBLIC
export function getFlask() {
    return getActiveFlask()?.o
    return activeFlask?.o;
}

export function onFlaskDisposal(cb: () => void) {
    const flask = getActiveFlask();
    if (!flask) return;
    flask.o.onDisposal(cb);
}



class NestableFlask {
    o: Flask = createFlask(this)
    // outer: NestableFlask | null = null
    // setOuter(flask: NestableFlask | null) {
    // }
    cleanups: Set<() => void> = new Set()

    constructor(public outer: NestableFlask | null, public __devName: string) {
        this.outer = outer;
        //@ts-expect-error setting read-only
        this.o.outer = outer?.o;
    }
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
            } finally {
                popFlask();
            }
        },

        reactivate() {
            pushFlask(_flask)
        },

        deactivate() {
            if (getActiveFlask() === _flask)
                popFlask()
        }
    };
}

export function collectEffects<T>(run: (flask: Flask, outerFlask: Flask | null) => T, __devName: string) {
    const outerFlask = getActiveFlask();
    const _flask = new NestableFlask(outerFlask, __devName);
    try {
        pushFlask(_flask);
        return run(_flask.o, outerFlask?.o || null);
    } finally {
        popFlask();

    }
}


export function bindFlask(callback: Callback) {
    const flask = getActiveFlask()!;
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









