import {  computed, ComputedRef, DebuggerOptions, effectScope, watch, watchEffect, WatchOptions, WatchOptionsBase } from "vue";
import { ListenerOptions, $listen, $subscribe, PendingCancelOp} from "@rue/flask";
import { inComponentSetup } from "@rue/paravue";


export function onChange<
    T extends Parameters<typeof watch>[0],
    CB extends Parameters<typeof watch>[1],
    O extends ListenerOptions & WatchOptions,
>(target: T, handler: CB, options?: O) {
    return $listen(handler, options, {
        enroll(handler) {
            return watch(target, handler, options);
        },
        remove(unwatch) {
            unwatch();
        }
    });
}


export function initReactiveEffect<
    CB extends Parameters<typeof watchEffect>[0],
    O extends ListenerOptions & WatchOptionsBase,
>(effect: CB, options?: O) {
    return $listen(effect, options, {
        enroll(handler) {
            return watch(effect, handler, options);
        },
        remove(unwatch) {
            unwatch();
        }
    });
}



export function compute<T>(getter: () => T, options?: { until: (stop: () => void) => PendingCancelOp, $lifetime?: true } & DebuggerOptions): ComputedRef<T> {
    if (options && "until" in options) {
        let computedRef: ComputedRef<T>;
        const scope = effectScope(true);
        scope.run(() => {
            $subscribe(getter, options, {
                enroll: (getter) => {
                    if (__DEV__) computedRef = computed(getter, options);
                    else computedRef = computed(getter);
                },
                remove: () => scope.stop(),
            })
        })
        return computedRef!;
    }
    else if (inComponentSetup()) {
        if (__DEV__) return computed(getter, options);
        return computed(getter);
    }
    return computed(getter)
}
