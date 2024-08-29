import { $listen, $schedule, ListenerOptions } from "@rue/flask";
import { DynamicNode, getActiveDynamicNode } from "./DynamicNode";


type TaskQueue = Set<() => void>

export enum LifecycleHook {
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


function createLifecycleHook(name: LifecycleHook.ON_DESTROY) {
    return function on(handler: () => void, _node?: DynamicNode) {
        const node = _node || getActiveDynamicNode();
        if (!node) throw new Error("Lifecycle hooks cannot be called outside of component setup");
        const taskQueue = useTaskQueue(node, name)

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

function createUpdateHook(name: LifecycleHook.ON_ACTIVATED | LifecycleHook.ON_DEACTIVATE) {
    return function on(handler: () => void, options?: ListenerOptions, _node?: DynamicNode) {
        const node = _node || getActiveDynamicNode();
        if (!node) throw new Error("Lifecycle hooks cannot be called outside of component setup");
        const taskQueue = useTaskQueue(node, name)

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


export const onDeactivate = createUpdateHook(LifecycleHook.ON_DEACTIVATE)
export const onActivated = createUpdateHook(LifecycleHook.ON_ACTIVATED)
export const onDestroy = createLifecycleHook(LifecycleHook.ON_DESTROY)



