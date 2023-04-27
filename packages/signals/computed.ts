import { $subscribe, inSceneSetup } from "../flask";
import { ComputedRef, DebuggerOptions, computed, effectScope, getCurrentInstance as inComponentSetup } from "vue";
import { Signal } from "./signals";

export function computed$<T>(computation: () => T, options?: { $outlive?: true, until?: (stop: () => void) => void, $lifetime?: true } & DebuggerOptions): Signal<T> {
    let computedRef: ComputedRef<T>;
    if (inSceneSetup() || options && ("until" in options || "$outlive" in options && options.$outlive)) { //QUESTION: check if inFlask??
        const scope = effectScope(true);
        scope.run(() => {
            $subscribe(computation, options, {
                enroll: (computation) => {
                    if (__DEV__) computedRef = computed(computation, options); //assumes `scope.run` runs synchronously. TODO: check if this is true
                    else computedRef = computed(computation); //assumes `scope.run` runs synchronously. TODO: check if this is true
                },
                remove: () => scope.stop(),
            })
        })
    }
    // else if (inComponentSetup()) {
    //     if (__DEV__) {
    //         computedRef = computed(computation, options);
    //         // return () => computedRef.value;
    //     }
    //     const computedRef = computed(computation);
    //     // return () => computedRef.value;
    // }
    else computedRef = computed(computation);
    return () => computedRef.value;
}

// export function computed$<F extends () => any>(computation: F, outlive?: boolean) {
//     if (outlive) {
//         const scope = effectScope(true);
//         scope.run(() => {

//         })
//     }
//     else {
//         const computedRef = computed(computation);
//         return () => computedRef.value;
//     }
// }