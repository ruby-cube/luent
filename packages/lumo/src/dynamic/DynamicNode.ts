import { collectEffects, EffectFlask } from "@rue/flask";
import { _NodePod } from "../node/NodePod";
import { LifecycleHook } from "./lifecycle";
import { popDynamicNode, pushDynamicNode } from "./nodestack";
import { SetMap } from "@rue/utils";

type Task = ()=>void

export class DynamicNode {
    flask: EffectFlask | undefined;

    setFlask(flask: EffectFlask) {
        this.flask = flask;
    }


    constructor(
        public parent: DynamicNode | null,
        public nodePod?: _NodePod,
        public preserve?: boolean,
    ) {
        this.preserve = !!parent && parent.preserve || preserve || false
    }

    // setNodePod(nodePod: _NodePod) {
    //     this.nodePod = nodePod;
    // }

    tasks: SetMap<LifecycleHook, Task> = new SetMap();

    emit(hookName: LifecycleHook) {
        const taskQueue = this.tasks.get(hookName);
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
        this.emit(LifecycleHook.ON_CREATED)
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
        this.emit(LifecycleHook.ON_DEACTIVATE)
    }

    unmount() {
        const nodePod = this.nodePod;
        if (!nodePod) {
            // throw new Error('No nodePod :( This should never happen')
            console.warn("No nodePod :( nodePod was never set or already destroyed by hook cascade (not sure if this is problematic yet. It might be when differentiating create, mount, and show)")
            return;
        }
        nodePod.forEachNode((node) => {
            node.remove();
        })
        this.deactivate()
    }

    destroy() {
        this.unmount();
        this.emit(LifecycleHook.ON_DESTROY) // this stops all onActivated and onDeactivate listeners that are set to go until destroy
        this.flask?.dispose()
        this.nodePod = undefined
        this.flask = undefined
        this.parent = null
        //TODO: clear or null all tasks??
    }
}

export const NULLISH_DYNAMIC_NODE = new DynamicNode(null)




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





