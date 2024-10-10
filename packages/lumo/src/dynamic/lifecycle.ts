import { $listen, $schedule, ListenerOptions, SchedulerOptions } from "@rue/flask";
import type { DynamicNode } from "./DynamicNode";
import { getActiveDynamicNode } from "./nodestack";


type TaskQueue = Set<() => void>

export enum LifecycleHook {
    ON_CREATED = 'c',
    ON_ACTIVATED = 'a',
    ON_DEACTIVATE = 'bda',
    ON_DESTROY = 'bd',
}







export function createLifecycleHook(name: LifecycleHook.ON_DESTROY | LifecycleHook.ON_CREATED) {
    return function on(handler: () => void, options?: SchedulerOptions, _node?: DynamicNode) {
        const node = _node || getActiveDynamicNode();
        const tasks = node.tasks

        return $schedule(handler, options || {}, {
            enroll(handler) {
                tasks.addToSet(handler, name)
            },
            remove(handler) {
                tasks.deleteFromSet(handler, name)
            }
        });
    }
}

function createActivationHook(name: LifecycleHook.ON_ACTIVATED | LifecycleHook.ON_DEACTIVATE) {
    return function on(handler: () => void, options: ListenerOptions = {}, _node?: DynamicNode) {
        const node = _node || getActiveDynamicNode();
        const tasks = node.tasks
        return $listen(handler, { until: (cleanUp) => onDestroy(cleanUp, {}, node), ...options }, { //TODO: not sure about this
            enroll(handler) {
                tasks.addToSet(handler, name)
            },
            remove(handler) {
                tasks.deleteFromSet(handler, name)
            }
        });
    }
}


export const onDeactivate = createActivationHook(LifecycleHook.ON_DEACTIVATE)
export const onActivated = createActivationHook(LifecycleHook.ON_ACTIVATED)
export const onDestroy = createLifecycleHook(LifecycleHook.ON_DESTROY)
export const onCreated = createLifecycleHook(LifecycleHook.ON_CREATED)


