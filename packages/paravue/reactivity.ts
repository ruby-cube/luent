import { computed, ComputedRef, DebuggerOptions, effectScope, onUnmounted as _onUnmounted, inject, isReactive, isRef, nextTick, PropType, Ref, ref, ShallowReactive, shallowReactive, toRaw, watch, WatchOptions, WatchStopHandle, onBeforeUnmount, getCurrentInstance, ComponentInternalInstance } from "vue";
import { Callback, ListenerOptions, $listen, $subscribe} from "@rue/planify";
import { isSettingUpComponent } from "./component";

export const reactive = shallowReactive as <T extends object>(target: T) => Reactive<T>;
export type Reactive<T> = { [P in keyof ShallowReactive<{}>]-?: true; } & T
export interface IReactive extends Reactive<{}> { };

export const onViewUpdated = nextTick;
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

export function compute<T>(getter: () => T, options?: { until: (stop: () => void) => void, $lifetime?: true } & DebuggerOptions): ComputedRef<T> {
    if (options && "until" in options) {
        let computedRef: ComputedRef<T>;
        const scope = effectScope(true);
        scope.run(() => {
            $subscribe(getter, options, {
                enroll: (getter) => {
                    if (__DEV__) computedRef = computed(getter, options); //assumes `run` runs synchronously. TODO: check if this is true
                    else computedRef = computed(getter); //assumes `run` runs synchronously. TODO: check if this is true
                },
                remove: () => scope.stop(),
            })
        })
        return computedRef!;
    }
    else if (isSettingUpComponent()) {
        if (__DEV__) return computed(getter, options);
        return computed(getter);
    }
    return computed(getter)
}

const componentMap = new WeakMap();
export function onUnmounted(handler: Callback, options?: ListenerOptions) {
    const currentInstance = getCurrentInstance();
    if (!currentInstance) throw new Error("onUnmounted must be called from within component setup function")
    const existingCallbacks = componentMap.get(currentInstance);
    const handlers = existingCallbacks ? existingCallbacks : new Set();
    if (!existingCallbacks) {
        componentMap.set(currentInstance, handlers)
        onBeforeUnmount(() => {
            _onUnmounted(() => {
                for (const cb of handlers) {
                    cb()
                }
            })
        })
    }
    return $listen(handler, options, {
        enroll(handler) {
            handlers.add(handler);
        },
        remove(handler) {
            handlers.delete(handler)
        },
        onceAsDefault: true
    })
}

if (__TEST__) {
    onUnmounted.getCallbacks = (component: ComponentInternalInstance) => componentMap.get(component);
}
