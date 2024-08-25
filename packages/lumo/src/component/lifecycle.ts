import { $listen, $schedule, ListenerOptions } from "@rue/flask";
import { InternalComponent } from "./InternalComponent";
import { getCurrentComponent } from "./componentStack";


type TaskQueue = Set<() => void>

export enum LifecycleHook {
    SETUP_COMPLETED = 'sc',
    // BEFORE_MOUNT = 'bm',
    // MOUNTED = 'm',
    BEFORE_UPDATE = 'bu',
    UPDATED = 'u',
    // BEFORE_UNMOUNT = 'bum',
    // UNMOUNTED = 'um',
    // BEFORE_DEACTIVATE = 'da',
    // ACTIVATED = 'a',
    // RENDER_TRIGGERED = 'rtg',
    // RENDER_TRACKED = 'rtc',
    // ERROR_CAPTURED = 'ec',
    // SERVER_PREFETCH = 'sp',
}


function useTaskQueue(component: InternalComponent, hookName: LifecycleHook) {
    let taskQueue = component.tasks[hookName]
    if (!taskQueue) {
        taskQueue = new Set();
        component.tasks[hookName] = taskQueue;
    }
    return taskQueue;
}


function createLifecycleHook(name: Exclude<LifecycleHook, LifecycleHook.BEFORE_UPDATE | LifecycleHook.UPDATED>) {
    return function on(handler: () => void, _component?: InternalComponent) {
        const component = _component || getCurrentComponent<InternalComponent>();
        if (!component) throw new Error("Lifecycle hooks cannot be called outside of component setup");
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

function createUpdateHook(name: LifecycleHook.BEFORE_UPDATE | LifecycleHook.UPDATED) {
    return function on(handler: () => void, options?: ListenerOptions, _component?: InternalComponent) {
        const component = _component || getCurrentComponent<InternalComponent>();
        if (!component) throw new Error("Lifecycle hooks cannot be called outside of component setup");
        const taskQueue = useTaskQueue(component, name)

        return $listen(handler, options || {}, {
            enroll(handler) {
                taskQueue.add(handler)
            },
            remove(handler) {
                taskQueue.delete(handler)
            }
        });
    }
}

export const onSetupCompleted = createLifecycleHook(LifecycleHook.SETUP_COMPLETED)
// export const beforeMount = createLifecycleHook(LifecycleHook.BEFORE_MOUNT) //TODO: Rename premount to something else ... it has ambiguous meaning--it could mean mount ahead of time
// export const onMounted = createLifecycleHook(LifecycleHook.MOUNTED)
export const beforeUpdate = createUpdateHook(LifecycleHook.BEFORE_UPDATE)
export const onUpdated = createUpdateHook(LifecycleHook.UPDATED)

// export const onActivated = createUpdateHook(LifecycleHook.ACTIVATED)
// export const onDeactivated = createUpdateHook(LifecycleHook.BEFORE_DEACTIVATE)
// export const beforeUnmount = createLifecycleHook(LifecycleHook.BEFORE_UNMOUNT)
// export const onUnmounted = createLifecycleHook(LifecycleHook.UNMOUNTED)



export default {
    onSetupCompleted,
    // beforeMount,
    // beforeUnmount,
    beforeUpdate,
    // onMounted,
    // onUnmounted,
    onUpdated,
}