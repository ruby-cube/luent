import { $schedule, collectEffects, EffectFlask, SchedulerOptions } from "@rue/flask";
import { _NodePod } from "../node/NodePod";
import { createLifecycleHook, LifecycleHook } from "./lifecycle";
import { popDynamicNode, pushDynamicNode } from "./nodestack";
import { SetMap } from "@rue/utils";

type Task = () => void

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

    onCreated?: (cb: () => void, options?: SchedulerOptions) => void
    onDestroy?: (cb: () => void, options?: SchedulerOptions) => void

    initializeOnCreatedHook() {
        return this.onCreated = (handler: () => void, options?: SchedulerOptions) => on(LifecycleHook.ON_CREATED, this, handler, options)
    }

    initializeOnDestroyHook() {
        return this.onDestroy = (handler: () => void, options?: SchedulerOptions) => on(LifecycleHook.ON_DESTROY, this, handler, options)
    }
}

function on(hookName: LifecycleHook, node: DynamicNode, handler: () => void, options?: SchedulerOptions) {
    const tasks = node.tasks

    return $schedule(handler, options || {}, {
        enroll(handler) {
            tasks.addToSet(handler, hookName)
        },
        remove(handler) {
            tasks.deleteFromSet(handler, hookName)
        }
    });
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




//TRANSITION DRAFT

let transitioning = false;

let mount = true;

function toggleMount() {
    mount = !mount;
}

btn.addEventListener("click", () => {
    if (transitioning) return;
    transitioning = true;
    toggleMount();

    if (mount) {
        console.log('mounting')
        div.appendChild(divIO);
        div.appendChild(divIO2);
        requestAnimationFrame(() => {
            handlePhaseIn()

            phaseIOIn()
            phaseIO2In()

            div.addEventListener(
                "transitionend",
                () => {
                    transitioning = false;
                },
                { once: true }
            );
        });
    } else {
        handlePhaseOut()
        phaseIOOut()
        phaseIO2Out()

        div.addEventListener(
            "transitionend",
            () => {
                transitioning = false;
                divIO.remove();
                divIO2.remove();
            },
            { once: true }
        );
    }
});

function onMount() {
    requestAnimationFrame(() => {
        if (phaseIn) phaseIn(() => {
            transitioning = false;
        })

    });
    for (const node of transitionNodes) {
        node.transitionIn?.()
    }
}

function onUnmount() {
    if (phaseOut) phaseOut(endTransition)

    for (const node of transitionNodes) {
        node.transitionOut?.(node => {
            transitioning = false;
            node.remove();
        })
    }

    function endTransition() {
        transitioning = false;
        unmountNodes()
    }
}



