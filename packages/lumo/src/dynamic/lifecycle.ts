import { $listen, $schedule, ListenerOptions, SchedulerOptions } from "@rue/flask";
import { DynamicNode, getActiveDynamicNode } from "./DynamicNode";


type TaskQueue = Set<() => void>

export enum LifecycleHook {
    ON_CREATED = 'c',
    ON_ACTIVATED = 'a',
    ON_DEACTIVATE = 'bda',
    ON_DESTROY = 'bd',
}




function useTaskQueue(node: DynamicNode, hookName: LifecycleHook) {
    let taskQueue = node.tasks[hookName]
    if (!taskQueue) {
        taskQueue = new Set();
        node.tasks[hookName] = taskQueue;
    }
    return taskQueue;
}


function createLifecycleHook(name: LifecycleHook.ON_DESTROY | LifecycleHook.ON_CREATED) {
    return function on(handler: () => void, options?: SchedulerOptions, _node?: DynamicNode) {
        const node = _node || getActiveDynamicNode();
        if (!node) throw new Error("Lifecycle hooks cannot be called outside of component setup");
        const taskQueue = useTaskQueue(node, name)

        return $schedule(handler, options || {}, {
            enroll(handler) {
                taskQueue.add(handler)
            },
            remove(handler) {
                taskQueue.delete(handler)
            }
        });
    }
}

function createActivationHook(name: LifecycleHook.ON_ACTIVATED | LifecycleHook.ON_DEACTIVATE) {
    return function on(handler: () => void, options: ListenerOptions = {}, _node?: DynamicNode) {
        const node = _node || getActiveDynamicNode();
        if (!node) throw new Error("Lifecycle hooks cannot be called outside of component setup");
        const taskQueue = useTaskQueue(node, name)

        return $listen(handler, { until: (cleanUp) => onDestroy(cleanUp, {}, node), flask: 'outlive', ...options }, {
            enroll(handler) {
                taskQueue.add(handler)
            },
            remove(handler) {
                taskQueue.delete(handler)
            }
        });
    }
}


export const onDeactivate = createActivationHook(LifecycleHook.ON_DEACTIVATE)
export const onActivated = createActivationHook(LifecycleHook.ON_ACTIVATED)
export const onDestroy = createLifecycleHook(LifecycleHook.ON_DESTROY)
export const onCreated = createLifecycleHook(LifecycleHook.ON_CREATED)


