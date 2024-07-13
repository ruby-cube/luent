import { $listen, $schedule, ListenerOptions } from "@rue/flask";
import { getCurrentComponent, InternalComponent } from "./component";


type TaskQueue = Set<() => void>

export enum LifecycleHook {
    PREMOUNT = 'pm',
    MOUNTED = 'm',
    PREUPDATE = 'pu',
    UPDATED = 'u',
    PREUNMOUNT = 'pum',
    UNMOUNTED = 'um',
    // DEACTIVATED = 'da',
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


function createLifecycleHook(name: Exclude<LifecycleHook, LifecycleHook.PREUPDATE | LifecycleHook.UPDATED>) {
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

function createUpdateHook(name: LifecycleHook.PREUPDATE | LifecycleHook.UPDATED) {
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

export const onPremount = createLifecycleHook(LifecycleHook.PREMOUNT) //TODO: Rename premount to something else ... it has ambiguous meaning--it could mean mount ahead of time
export const onMounted = createLifecycleHook(LifecycleHook.MOUNTED)
export const onPreupdate = createUpdateHook(LifecycleHook.PREUPDATE)
export const onUpdated = createUpdateHook(LifecycleHook.UPDATED)
export const onPreunmount = createLifecycleHook(LifecycleHook.PREUNMOUNT)
export const onUnmounted = createLifecycleHook(LifecycleHook.UNMOUNTED)



export default {
    onPremount,
    onPreunmount,
    onPreupdate,
    onMounted,
    onUnmounted,
    onUpdated,
}