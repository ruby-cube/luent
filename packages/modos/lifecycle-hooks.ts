import { $listen, ActiveListener, Callback, ListenerOptions, PendingOp } from "@rue/planify";
import { $beforeDestroyed, $beforeDisposedOf, $onDestroyed, $onDisposedOf, isMakingModel, onModelCreated, onModelMade, $onInstated, $onReinstated } from "./depot";
import { Modo } from "./Modo.role";


//NOTE: Lifecycle hooks can only be called within "make" function or role $construct

function warnOutOfScopeLifecycleHook(hookFn: Function) {
    console.warn(`${hookFn.name} hook must be run from within a Modos 'make' function scope`)
}

export function onCreated(cb: (model: Modo) => void) {
    if (__DEV__ && !isMakingModel()) warnOutOfScopeLifecycleHook(onCreated)
    return onModelCreated((ctx) => cb(ctx.model), { once: true });
}

export function onMade(cb: (model: Modo) => void) {
    if (__DEV__ && !isMakingModel()) warnOutOfScopeLifecycleHook(onMade)
    return onModelMade((ctx) => cb(ctx.model), { once: true });
}


export function onInstated<OPT extends ListenerOptions>(cb: (model: Modo) => void, options?: OPT) {
    if (__DEV__ && !isMakingModel()) warnOutOfScopeLifecycleHook(onInstated)
    let listener: ActiveListener;
    return $listen(cb, options, {
        enroll(cb) {
            onMade((model) => {
                listener = $onInstated(model, () => cb(model))
            })
        },
        remove() {
            listener.stop()
        }
    })
}

export function onReinstated<OPT extends ListenerOptions>(cb: (model: Modo) => void, options?: OPT) {
    if (__DEV__ && !isMakingModel()) warnOutOfScopeLifecycleHook(onReinstated)
    let listener: ActiveListener;
    return $listen(cb, options, {
        enroll(cb) {
            onMade((model) => {
                listener = $onReinstated(model, () => cb(model))
            })
        },
        remove() {
            listener.stop()
        }
    })
}



export function beforeDisposedOf<OPT extends ListenerOptions>(cb: Parameters<typeof $beforeDisposedOf>[1], options?: OPT) {
    if (__DEV__ && !isMakingModel()) warnOutOfScopeLifecycleHook(beforeDisposedOf)
    let listener: ActiveListener;
    return $listen(cb, options, {
        enroll(cb) {
            onMade((model) => {
                listener = $beforeDisposedOf(model, cb)
            })
        },
        remove() {
            listener.stop()
        }
    })
}

export function onDisposedOf<OPT extends ListenerOptions>(cb: Parameters<typeof $onDisposedOf>[1], options?: OPT) {
    if (__DEV__ && !isMakingModel()) warnOutOfScopeLifecycleHook(onDisposedOf)
    let listener: ActiveListener;
    return $listen(cb, options, {
        enroll(cb) {
            onMade((model) => {
                listener = $onDisposedOf(model, cb)
            })
        },
        remove() {
            listener.stop()
        }
    })
}
if (__TEST__) {
    //@ts-ignore
    onDisposedOf.handlers = (model) => $onDisposedOf.targetMap.get(model);
}



export function beforeDestroyed(cb: (model: Modo) => void) {
    if (__DEV__ && !isMakingModel()) warnOutOfScopeLifecycleHook(beforeDestroyed)
    let pendingOp: PendingOp;
    return $listen(cb, {once: true}, {
        enroll(cb) {
            onMade((model) => {
                pendingOp = $beforeDestroyed(model, () => cb(model))
            })
        },
        remove() {
            pendingOp.cancel()
        }
    })
}

export function onDestroyed(cb: Parameters<typeof $onDestroyed>[1]) {
    if (__DEV__ && !isMakingModel()) warnOutOfScopeLifecycleHook(onDestroyed)
    let pendingOp: PendingOp;
    const options = { once: true as const }
    return $listen(cb, options, {
        enroll(cb) {
            onMade((model) => {
                pendingOp = $onDestroyed(model, cb)
            })
        },
        remove() {
            pendingOp.cancel()
        }
    })
}
