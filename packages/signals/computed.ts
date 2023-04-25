import { $subscribe } from "@rue/planify";
import { ComputedRef, DebuggerOptions, computed, effectScope, getCurrentInstance as inComponentSetup } from "vue";

export function compute<T>(getter: () => T, options?: { $outlive?: true, until: (stop: () => void) => void, $lifetime?: true } & DebuggerOptions): ComputedRef<T> {
    if (options && "until" in options) {
        let computedRef: ComputedRef<T>;
        const scope = effectScope(true);
        scope.run(() => {
            $subscribe(getter, options, {
                enroll: (getter) => {
                    if (__DEV__) computedRef = computed(getter, options); //assumes `scope.run` runs synchronously. TODO: check if this is true
                    else computedRef = computed(getter); //assumes `scope.run` runs synchronously. TODO: check if this is true
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

export function computed$<F extends () => any>(computation: F, outlive?: boolean) {
    if (outlive) {
        const scope = effectScope(true);
        scope.run(() => {

        })
    }
    else {
        const computedRef = computed(computation);
        return () => computedRef.value;
    }
}