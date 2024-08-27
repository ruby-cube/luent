import { $listen, $schedule, ListenerOptions } from "@rue/flask";
import { InternalComponent } from "./InternalComponent";
import { getCurrentComponent } from "./componentStack";


type TaskQueue = Set<() => void>

export enum LifecycleHook {
    CREATED = 'c',
    BEFORE_UPDATE = 'bu',
    UPDATED = 'u',
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

export const onCreated = createLifecycleHook(LifecycleHook.CREATED)
export const beforeUpdate = createUpdateHook(LifecycleHook.BEFORE_UPDATE)
export const onUpdated = createUpdateHook(LifecycleHook.UPDATED)



export default {
    onCreated,
    beforeUpdate,
    onUpdated,
}