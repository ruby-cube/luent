import { $listen, $schedule, ListenerOptions } from "@rue/flask";
import { DynamicNode, getActiveDynamicNode } from "./DynamicNode";


type TaskQueue = Set<() => void>

export enum LifecycleHook {
    BEFORE_UNMOUNT = 'bum',
    MOUNTED = 'm',
    BEFORE_DEACTIVATE = 'da',
    ACTIVATED = 'a',
}


function useTaskQueue(node: DynamicNode, hookName: LifecycleHook) {
    let taskQueue = node.tasks[hookName]
    if (!taskQueue) {
        taskQueue = new Set();
        node.tasks[hookName] = taskQueue;
    }
    return taskQueue;
}


function createLifecycleHook(name: LifecycleHook.BEFORE_UNMOUNT | LifecycleHook.MOUNTED) {
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

function createUpdateHook(name: LifecycleHook.ACTIVATED | LifecycleHook.BEFORE_DEACTIVATE) {
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


export const onActivated = createUpdateHook(LifecycleHook.ACTIVATED)
export const beforeDeactivate = createUpdateHook(LifecycleHook.BEFORE_DEACTIVATE)
export const beforeUnmount = createLifecycleHook(LifecycleHook.BEFORE_UNMOUNT)
export const onMounted = createLifecycleHook(LifecycleHook.MOUNTED)



export default {
    onMounted,
    beforeUnmount,
    onActivated,
    beforeDeactivate
}