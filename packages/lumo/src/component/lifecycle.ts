import { $listen, $schedule, ListenerOptions } from "@rue/flask";
import { InternalComponent } from "./InternalComponent";
import { getCurrentComponent } from "./componentStack";


type TaskQueue = Set<() => void>

export enum LifecycleHook {
    ON_CREATED = 'c',
    // BEFORE_UPDATE = 'bu',
    ON_UPDATED = 'u',
}


function useTaskQueue(component: InternalComponent, hookName: LifecycleHook) {
    let taskQueue = component.tasks[hookName]
    if (!taskQueue) {
        taskQueue = new Set();
        component.tasks[hookName] = taskQueue;
    }
    return taskQueue;
}


function createLifecycleHook(name: LifecycleHook.ON_CREATED) {
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

function createUpdateHook(name: LifecycleHook.ON_UPDATED) {
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

export const onCreated = createLifecycleHook(LifecycleHook.ON_CREATED)
export const onUpdated = createUpdateHook(LifecycleHook.ON_UPDATED)



export default {
    onCreated,
    onUpdated,
}