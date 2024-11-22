import { $listen, $schedule, ActiveListener, collectEffects, EffectFlask, ListenerOptions, PendingOp, SchedulerOptions } from "@rue/flask";
import { _NodePod } from "../node/NodePod";
import { popDynamicNode, pushDynamicNode } from "./nodestack";
import { SetMap } from "@rue/utils";

type Task = () => void
export enum LifecycleHook {
    ON_CREATED = 'c',
    ON_REACTIVATE = 'a',
    ON_DEACTIVATE = 'bda',
    ON_DESTROY = 'bd',
}

// let count = 0;

export class DynamicNode {
    flask: EffectFlask | undefined;
    // count: number;

    setFlask(flask: EffectFlask) {
        this.flask = flask;
    }

    constructor(
        public parent: DynamicNode | null,
        public nodePod?: _NodePod,
        public preserve?: boolean,
    ) {
        // this.count = count++;
        // console.trace('new dynamic node', this.count)
        this.onDestroy = (handler: () => void, options?: SchedulerOptions) => at(LifecycleHook.ON_DESTROY, this, handler, options)
        this.onDeactivate = (handler: () => void, options?: SchedulerOptions) => on(LifecycleHook.ON_DEACTIVATE, this, handler, options)
        this.onReactivate = (handler: () => void, options?: SchedulerOptions) => on(LifecycleHook.ON_REACTIVATE, this, handler, options)
    }

    // setNodePod(nodePod: _NodePod) {
    //     this.nodePod = nodePod;
    // }

    tasks: SetMap<LifecycleHook, Task> = new SetMap();

    emit(hookName: LifecycleHook) {
        const taskQueue = this.tasks.get(hookName);
    if (hookName === LifecycleHook.ON_REACTIVATE) console.log('emit', taskQueue)
        if (!taskQueue) return;
        for (const task of taskQueue) {
            task();
        }
    }

    mount(render: () => void) {
        pushDynamicNode(this);
        collectEffects((flask) => {
            this.setFlask(flask)
            render()
        }, render.name)
        popDynamicNode();
        this.emit(LifecycleHook.ON_CREATED)
    }

    reactivate(remount: () => void) {
        this.emit(LifecycleHook.ON_REACTIVATE)
        remount();
        // pushDynamicNode(this);
        // this.flask?.reactivate()
        // render()
        // this.flask?.deactivate()
        // popDynamicNode();
    }

    deactivate() {

        this.emit(LifecycleHook.ON_DEACTIVATE)
    }


    unmount() {
        const nodePod = this.nodePod;
        if (!nodePod) {
            throw new Error("No nodePod :( nodePod was never set or already destroyed by hook cascade (not sure if this is problematic yet. It might be when differentiating create, mount, and show)")
        }
        nodePod.forEachNode((node) => {
            node.remove();
        })
    }

    destroy() {
        this.unmount();
        this.emit(LifecycleHook.ON_DESTROY) // this stops all onReactivate and onDeactivate listeners that are set to go until destroy
        this.flask?.dispose()
        this.nodePod = undefined
        this.flask = undefined
        this.parent = null
        //TODO: clear or null all tasks??
    }

    onCreated?: (handler: () => void, options?: SchedulerOptions) => PendingOp<void>
    onDestroy: (handler: () => void, options?: SchedulerOptions) => PendingOp<void>
    onDeactivate: (handler: () => void, options?: ListenerOptions) => ActiveListener
    onReactivate: (handler: () => void, options?: ListenerOptions) => ActiveListener

    initializeOnCreatedHook() {
        if (this.onCreated) return this.onCreated;
        return this.onCreated = (handler: () => void, options?: SchedulerOptions) => at(LifecycleHook.ON_CREATED, this, handler, options)
    }

    // initializeOnDestroyHook() {
    //     if (this.onDestroy) return this.onDestroy;
    //     return this.onDestroy = (handler: () => void, options?: SchedulerOptions) => at(LifecycleHook.ON_DESTROY, this, handler, options)
    // }

    // initializeOnDeactivateHook() {
    //     if (this.onDeactivate) return this.onDeactivate;
    //     this.initializeOnDestroyHook()
    //     return this.onDeactivate = (handler: () => void, options?: SchedulerOptions) => on(LifecycleHook.ON_DEACTIVATE, this, handler, options)
    // }

    // initializeOnActivatedHook() {
    //     if (this.onReactivate) return this.onReactivate;
    //     this.initializeOnDestroyHook()
    //     return this.onReactivate = (handler: () => void, options?: SchedulerOptions) => on(LifecycleHook.ON_REACTIVATE, this, handler, options)
    // }
}

function at(hookName: LifecycleHook, node: DynamicNode, handler: () => void, options: SchedulerOptions = {}) {
    const tasks = node.tasks

    return $schedule(handler, options, {
        enroll(handler) {
            tasks.addToSet(handler, hookName)
        },
        remove(handler) {
            tasks.deleteFromSet(handler, hookName)
        }
    });
}

function on(hookName: LifecycleHook, node: DynamicNode, handler: () => void, options: ListenerOptions = {}) {
    const tasks = node.tasks

    return $listen(handler, { until: node.onDestroy, ...options }, {
        enroll(handler) {
            tasks.addToSet(handler, hookName)
        },
        remove(handler) {
            tasks.deleteFromSet(handler, hookName)
        }
    });
}

export const NULLISH_DYNAMIC_NODE = new DynamicNode(null)




// let mounting = false;

// export function markMountPhase() {
//     mounting = true;
// }

// export function unmarkMountPhase() {
//     mounting = false;
// }


// export function isMountPhase() {
//     return mounting;
// }





