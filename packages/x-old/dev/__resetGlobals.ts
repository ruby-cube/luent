const globalsResetters: Set<() => void> = new Set();

export function registerGlobalResetter(cb: () => void) {
    globalsResetters.add(cb);
}

export function __resetGlobals() {
    for (const reset of globalsResetters) {
        reset();
    }
}