import { $listen, $schedule, ListenerOptions } from "@rue/flask";
import { InternalComponent } from "./InternalComponent";
import { getCurrentComponent } from "./componentStack";


type TaskQueue = Set<() => void>

export enum LifecycleHook {
    AFTER_CREATE = 'c',
    BEFORE_UPDATE = 'bu',
    AFTER_UPDATE = 'u',
}


function useTaskQueue(component: InternalComponent, hookName: LifecycleHook) {
    let taskQueue = component.tasks[hookName]
    if (!taskQueue) {
        taskQueue = new Set();
        component.tasks[hookName] = taskQueue;
    }
    return taskQueue;
}


function createLifecycleHook(name: Exclude<LifecycleHook, LifecycleHook.BEFORE_UPDATE | LifecycleHook.AFTER_UPDATE>) {
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

function createUpdateHook(name: LifecycleHook.BEFORE_UPDATE | LifecycleHook.AFTER_UPDATE) {
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

export const afterCreate = createLifecycleHook(LifecycleHook.AFTER_CREATE)
export const beforeUpdate = createUpdateHook(LifecycleHook.BEFORE_UPDATE)
export const afterUpdate = createUpdateHook(LifecycleHook.AFTER_UPDATE)



export default {
    afterCreate,
    beforeUpdate,
    afterUpdate,
}