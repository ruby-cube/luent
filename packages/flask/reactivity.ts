import { nextTick,  watch, WatchOptions } from "vue";
import { ListenerOptions, $listen} from "@rue/planify";



export const afterReactiveFlush = nextTick;


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

// export function compute<T>(getter: () => T, options?: { until: (stop: () => void) => void, $lifetime?: true } & DebuggerOptions): ComputedRef<T> {
//     if (options && "until" in options) {
//         let computedRef: ComputedRef<T>;
//         const scope = effectScope(true);
//         scope.run(() => {
//             $subscribe(getter, options, {
//                 enroll: (getter) => {
//                     if (__DEV__) computedRef = computed(getter, options); //assumes `scope.run` runs synchronously. TODO: check if this is true
//                     else computedRef = computed(getter); //assumes `scope.run` runs synchronously. TODO: check if this is true
//                 },
//                 remove: () => scope.stop(),
//             })
//         })
//         return computedRef!;
//     }
//     else if (inComponentSetup()) {
//         if (__DEV__) return computed(getter, options);
//         return computed(getter);
//     }
//     return computed(getter)
// }
