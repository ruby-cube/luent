import { collectEffects, EffectFlask } from "@rue/flask";
import { _NodePod } from "../node/NodePod";
import { LifecycleHook } from "./lifecycle";

export class DynamicNode {
    flask: EffectFlask | undefined;

    setFlask(flask: EffectFlask) {
        this.flask = flask;
    }


    constructor(
        public parent: DynamicNode | null,
        public preserve?: boolean,
        public nodePod?: _NodePod
    ) {
        this.preserve = !!parent && parent.preserve || preserve || false
    }

    setNodePod(nodePod: _NodePod) {
        this.nodePod = nodePod;
    }

    tasks: {
        [LifecycleHook.ON_ACTIVATED]: Set<() => void> | undefined;
        [LifecycleHook.ON_DESTROY]: Set<() => void> | undefined;
        [LifecycleHook.ON_DEACTIVATE]: Set<() => void> | undefined;
    } = {
            [LifecycleHook.ON_ACTIVATED]: undefined,
            [LifecycleHook.ON_DESTROY]: undefined,
            [LifecycleHook.ON_DEACTIVATE]: undefined,
        };

    private getTaskQueue(hookName: LifecycleHook) {
        let taskQueue = this.tasks[hookName]
        // if (!taskQueue) throw new Error("taskQueue not found")
        return taskQueue;
    }

    emit(hookName: LifecycleHook) {
        const taskQueue = this.getTaskQueue(hookName);
        if (!taskQueue) return;
        for (const task of taskQueue) {
            task();
        }
    }

    activate(render: () => void) {
        pushDynamicNode(this);
        collectEffects((flask) => {
            this.setFlask(flask)
            render()
        }, render.name)
        popDynamicNode();
        this.emit(LifecycleHook.ON_ACTIVATED)
    }


    reactivate(render: () => void) {
        pushDynamicNode(this);
        // this.flask?.reactivate()
        render()
        // this.flask?.deactivate()
        popDynamicNode();
        this.emit(LifecycleHook.ON_ACTIVATED)
    }


    deactivate() {
        console.log('deactivate')
        this.emit(LifecycleHook.ON_DEACTIVATE)
    }
    
    unmount() {
        const nodePod = this.nodePod;
        if (!nodePod) throw new Error('No nodePod :( This should never happen')
            nodePod.forEachNode((node) => {
            node.remove();
        })
        this.deactivate()
    }

    destroy() {
        this.unmount();
        console.log('destroy')
        this.emit(LifecycleHook.ON_DESTROY) // this stops all onActivated and onDeactivate listeners that are set to go until destroy
        console.log('dispose')
        this.flask?.dispose()
        this.nodePod = undefined
        this.flask = undefined
        this.parent = null
        //TODO: clear or null all tasks??
    }
}

export const NULLISH_DYNAMIC_NODE = new DynamicNode(null)


let activeDynamicNode: DynamicNode | null = null
let parent: DynamicNode | null = null;

export function getActiveDynamicNode() {
    return activeDynamicNode;
}

export function pushDynamicNode(dynamicNode: DynamicNode) {
    parent = activeDynamicNode;
    activeDynamicNode = dynamicNode;
    dynamicNode.flask?.reactivate()
}

export function popDynamicNode() {
    activeDynamicNode?.flask?.deactivate();
    activeDynamicNode = parent;
    parent = parent?.parent || null;
}


let mounting = false;

export function markMountPhase() {
    mounting = true;
}

export function unmarkMountPhase() {
    mounting = false;
}


export function isMountPhase() {
    return mounting;
}





