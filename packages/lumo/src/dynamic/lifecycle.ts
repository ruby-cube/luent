import { $listen, $schedule, ListenerOptions } from "@rue/flask";
import { DynamicNode, getActiveDynamicNode } from "./DynamicNode";


type TaskQueue = Set<() => void>

export enum LifecycleHook {
    MOUNTED = 'm',
    BEFORE_UNMOUNT = 'bum',
    BEFORE_DESTROY = 'bd',
}


function useTaskQueue(node: DynamicNode, hookName: LifecycleHook) {
    let taskQueue = node.tasks[hookName]
    if (!taskQueue) {
        taskQueue = new Set();
        node.tasks[hookName] = taskQueue;
    }
    return taskQueue;
}


function createLifecycleHook(name: LifecycleHook.BEFORE_DESTROY) {
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

function createUpdateHook(name: LifecycleHook.MOUNTED | LifecycleHook.BEFORE_UNMOUNT) {
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


export const beforeUnmount = createUpdateHook(LifecycleHook.BEFORE_UNMOUNT)
export const onMounted = createUpdateHook(LifecycleHook.MOUNTED)
export const beforeDestroy = createLifecycleHook(LifecycleHook.BEFORE_DESTROY)



export default {
    onMounted,
    beforeUnmount,
    // onActivated,
    // beforeDeactivate
}