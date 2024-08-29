import { collectEffects, EffectFlask } from "@rue/flask";
import { preserveAllRequested } from "../conditional/create_if";
import { _NodePod } from "../node/NodePod";
import { beforeDeactivate, beforeDestroy, beforeUnmount, LifecycleHook } from "./lifecycle";

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
        [LifecycleHook.MOUNTED]: Set<() => void> | undefined;
        [LifecycleHook.BEFORE_UNMOUNT]: Set<() => void> | undefined;
        [LifecycleHook.BEFORE_DESTROY]: Set<() => void> | undefined;
        // [LifecycleHook.ACTIVATED]: Set<() => void> | undefined;
        [LifecycleHook.BEFORE_DEACTIVATE]: Set<() => void> | undefined;
    } = {
            [LifecycleHook.MOUNTED]: undefined,
            [LifecycleHook.BEFORE_UNMOUNT]: undefined,
            [LifecycleHook.BEFORE_DESTROY]: undefined,
            // [LifecycleHook.ACTIVATED]: undefined,
            [LifecycleHook.BEFORE_DEACTIVATE]: undefined,
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

            // set up hook cascade
            const parent = this.parent;
            if (parent instanceof DynamicNode) {
                beforeDeactivate(() => this.deactivate(), undefined, parent)
                beforeUnmount(() => this.unmount(), undefined, parent)
                beforeDestroy(() => this.destroy(), parent)
            }
        }, render.name)
        this.emit(LifecycleHook.MOUNTED) //TODO: changed to activated
        popDynamicNode();
    }


    deactivate() {
        this.emit(LifecycleHook.BEFORE_DEACTIVATE)
        this.flask?.dispose()
    }

    unmount() {
        this.emit(LifecycleHook.BEFORE_UNMOUNT)
        const nodePod = this.nodePod;
        if (!nodePod) throw new Error('No nodePod :( This should never happen')
        nodePod.forEachNode((node) => {
            node.remove();
        })
        this.deactivate()
    }

    destroy() {
        this.unmount();
        this.emit(LifecycleHook.BEFORE_DESTROY)
        this.nodePod = undefined
        this.flask = undefined
        this.parent = null
        this.deactivate()
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






