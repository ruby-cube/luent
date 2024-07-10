import { $listen, $schedule, ListenerOptions } from "@rue/flask";
import { getCurrentComponent, InternalComponent } from "./component";


type TaskQueue = Set<() => void>

export enum LifecycleHooks {
    // BEFORE_CREATE = 'bc',
    // CREATED = 'c',
    BEFORE_MOUNT = 'bm',
    MOUNTED = 'm',
    BEFORE_UPDATE = 'bu',
    UPDATED = 'u',
    BEFORE_UNMOUNT = 'bum',
    UNMOUNTED = 'um',
    // DEACTIVATED = 'da',
    // ACTIVATED = 'a',
    // RENDER_TRIGGERED = 'rtg',
    // RENDER_TRACKED = 'rtc',
    // ERROR_CAPTURED = 'ec',
    // SERVER_PREFETCH = 'sp',
}


function useTaskQueue(component: InternalComponent, hookName: LifecycleHooks) {
    let taskQueue = component.tasks[hookName]
    if (!taskQueue) {
        taskQueue = new Set();
        component.tasks[hookName] = taskQueue;
    }
    return taskQueue;
}


function createLifecycleHook(name: Exclude<LifecycleHooks, LifecycleHooks.BEFORE_UPDATE | LifecycleHooks.UPDATED>) {
    return function on(handler: () => void, _component?: InternalComponent) {
        const component = _component || getCurrentComponent();
        if (!component || component === 'root') throw new Error("Lifecycle hooks cannot be called outside of component setup");
        const taskQueue = useTaskQueue(component, name)

        return $schedule(handler, {}, {
            enroll(handler) {
                taskQueue.add(handler)
            },
            remove(handler) {
                taskQueue.delete(handler)
            }
        });
    }
}

function createUpdateHook(name: LifecycleHooks.BEFORE_UPDATE | LifecycleHooks.UPDATED) {
    return function on(handler: () => void, options?: ListenerOptions, _component?: InternalComponent) {
        const component = _component || getCurrentComponent();
        if (!component || component === 'root') throw new Error("Lifecycle hooks cannot be called outside of component setup");
        const taskQueue = useTaskQueue(component, name)

        return $listen(handler, options, {
            enroll(handler) {
                taskQueue.add(handler)
            },
            remove(handler) {
                taskQueue.delete(handler)
            }
        });

    }
}

export const onBeforeMount = createLifecycleHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createLifecycleHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createUpdateHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createUpdateHook(LifecycleHooks.UPDATED)
export const onBeforeUnmount = createLifecycleHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createLifecycleHook(LifecycleHooks.UNMOUNTED)



export default {
    onBeforeMount,
    onBeforeUnmount,
    onBeforeUpdate,
    onMounted,
    onUnmounted,
    onUpdated,
}