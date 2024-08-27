import { EffectFlask } from "@rue/flask";
import { preserveAllRequested } from "../conditional/$if";
import { _NodePod } from "../node/NodePod";
import { LifecycleHook } from "./lifecycle";

export class DynamicNode {
    flask: EffectFlask | undefined;

    setFlask(flask: EffectFlask) {
        this.flask = flask;
    }

    preserve: boolean;

    constructor(
        public parent: DynamicNode | null,
        public nodePod?: _NodePod
    ) {
        this.preserve = getPreserveStatus(parent)
    }

    setNodePod(nodePod: _NodePod) {
        this.nodePod = nodePod;
    }

    tasks: {
        [LifecycleHook.BEFORE_UNMOUNT]: Set<() => void> | undefined;
        [LifecycleHook.BEFORE_DESTROY]: Set<() => void> | undefined;
        [LifecycleHook.MOUNTED]: Set<() => void> | undefined;
        // [LifecycleHook.ACTIVATED]: Set<() => void> | undefined;
        // [LifecycleHook.BEFORE_DEACTIVATE]: Set<() => void> | undefined;
    } = {
            [LifecycleHook.BEFORE_UNMOUNT]: undefined,
            [LifecycleHook.BEFORE_DESTROY]: undefined,
            [LifecycleHook.MOUNTED]: undefined,
            // [LifecycleHook.ACTIVATED]: undefined,
            // [LifecycleHook.BEFORE_DEACTIVATE]: undefined,
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

    unmount() {
        this.emit(LifecycleHook.BEFORE_UNMOUNT)
        const nodePod = this.nodePod;
        if (!nodePod) throw new Error('No nodePod :( This should never happen')
        nodePod.forEachNode((node) => {
            node.remove();
        })
        // TODO: null node refs, preserve if needed
        this.flask?.dispose(); //TODO: instead of disposing, need to remove and preserve somehow
    }

    destroy() {
        this.emit(LifecycleHook.BEFORE_DESTROY)
        const nodePod = this.nodePod;
        if (!nodePod) throw new Error('No nodePod :( This should never happen')
        nodePod.forEachNode((node) => {
            node.remove();
        })
        // TODO: null node refs, preserve if needed
        this.flask?.dispose();
    }
}


let activeDynamicNode: DynamicNode | null = null
let parent: DynamicNode | null = null;

export function getActiveDynamicNode() {
    return activeDynamicNode;
}

export function pushDynamicNode(component: DynamicNode) {
    parent = activeDynamicNode;
    activeDynamicNode = component;
}

export function popDynamicNode() {
    activeDynamicNode = parent;
    parent = parent?.parent || null;
}


export function getPreserveStatus(
    // options: ComponentOptions | undefined,
    parent: DynamicNode | null,
) {
    // let preserveRequested: boolean | undefined = options && options.preserve;
    // if (preserveRequested && !isSettingUpConditionalMount()) {
    //     preserveRequested = false;
    //     if (__DEV__) console.warn('Extraneous preserve component request. Preserve component only within conditional `ifCase(condition, { mount: () => {} })` or `mountIf`')
    // }

    return preserveAllRequested() || !!parent && parent.preserve;
}






