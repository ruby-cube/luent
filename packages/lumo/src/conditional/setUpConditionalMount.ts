import { InternalComponent } from "../component/InternalComponent";
import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { setUpNodeEntity } from "../node/setUpNodeEntity";
import { watchForRender } from "../reactivity/watchForRender";
import { LifecycleHook } from "../component/lifecycle";
import { NodeEntity } from "../node/makeNode";
import { getNodeRef } from "../node/$Node";
import { areShallowEqualArrays, getDependencyTracker, getWithoutTracking, isShallowEqual } from "@rue/muonic";
import { ConditionalRenderSeries } from "./ConditionalRenderSeries";
import { RenderConditional } from "./ConditionalRenderKit";
import { makeDynamicNode } from "../dynamic/makeDynamicNode";
import { popComponent, pushComponent } from "../component/componentStack";
import { LifecycleHook as DynamicLifecycleHook } from "../dynamic/lifecycle";

export function setUpConditionalMount(
    component: InternalComponent,
    parent: Element,
    series: ConditionalRenderSeries,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
) {
    // evaluate conditions and render
    const { $conditions, activeIndex } = series.evaluateConditions()
    const dynamicPod = nodePod.appendDynamicPod();
    const _nodePod = dynamicPod.appendNodePod()

    let dynamicNode = makeDynamicNode(function renderConditional() {
        const initialNodeEntities = series.render(activeIndex)
        // append to dom and node pod
        for (const nodeEntity of initialNodeEntities) {
            setUpNodeEntity(component, parent, nodeEntity, _nodePod, fragment) //QUESTION: Why don't I call mountConditional here?
        }
    }, nodePod)
    dynamicNode.emit(DynamicLifecycleHook.MOUNTED)

    // set up watcher for updates
    watchForRender($conditions, updateConditional, { once: true })

    function updateConditional(newValue: boolean[], oldValue: boolean[]) {
        console.log("[ updating conditional ]")
        if (areShallowEqualArrays(newValue, oldValue)) return;
        pushComponent(component)
        // evaluate conditions
        const { $conditions, activeIndex } = series.evaluateConditions();

        // render and add/remove node pods
        component.emit(LifecycleHook.BEFORE_UPDATE)
        dynamicNode.unmount()

        // set up new conditional pod
        const nodePod = new _NodePod();
        dynamicNode = makeDynamicNode(function renderConditionalUpdate() {
            const nodeEntities = series.render(activeIndex)
            dynamicPod.replaceNodePod(0, nodePod);
            mountConditional(nodePod, component, parent, dynamicPod, nodeEntities);
        }, nodePod)
        if (dynamicNode.preserve) dynamicNode.emit(DynamicLifecycleHook.ACTIVATED) //FIX: emit mounted if it's the first render
        else dynamicNode.emit(DynamicLifecycleHook.MOUNTED)
        component.emit(LifecycleHook.UPDATED)

        // set up for next update
        watchForRender($conditions, updateConditional, { once: true })
        popComponent()
    }

}

export function emitHookBatch(hookName: LifecycleHook, components: InternalComponent[] | undefined) {
    if (!components) return;
    for (const compo of components) {
        compo.emit(hookName);
    }
}

// function forEachInNodePod(nodePod: _NodePod, doTask: (node: DOMNode) => void) {

// }




export function populateFragment(fragment: DocumentFragment, nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        fragment.appendChild(node)
    })
}

const preservedNodePods: WeakMap<RenderConditional, _NodePod> = new WeakMap();

function getPreservedNodePod(renderConditional: RenderConditional) {
    const nodePod = preservedNodePods.get(renderConditional)
    if (!nodePod) throw new Error("nodePod missing")
    return nodePod;
}

// function removePrevConditionalNodes(component: InternalComponent, dynamicPod: _DynamicNodePod) {
//     const nodePod = dynamicPod[0];
//     // const components = nodePod.componentsToUnmount;

//     // emitBeforeUnmount(components)
//     removeDOMNodes(nodePod)
//     if (!getActiveDynamicNode()?.preserve) 
//         nullNodeRefValues(nodePod, components)
//     emitUnmountedOrDeactivated(components)
// }

// function emitUnmountedOrDeactivated(components: InternalComponent[]) {
//     for (const component of components) {
//         if (getActiveDynamicNode()?.preserve) component.emit(LifecycleHook.BEFORE_DEACTIVATE);
//         else component.emit(LifecycleHook.UNMOUNTED);
//     }
// }

// function emitBeforeUnmount(components: InternalComponent[]) { //FIX: This should be dynamic nodes
//     for (const component of components) {
//         if (component.preserve) continue;
//         component.emit(LifecycleHook.BEFORE_UNMOUNT);
//     }
// }

// export function removeDOMNodes(nodePod: _NodePod) {

// }


// function insertNewConditionalNodes(component: InternalComponent, parent: Element, dynamicPod: _DynamicNodePod, nodeEntities: NodeEntity[]) {
//     // const nodePod = preserve ? getPreservedNodePod(renderConditional) : new _NodePod();


//     // emitActivated(nodePod.componentsToUnmount)
//     // restoreNodeRefValues(nodePod, nodePod.componentsToUnmount)
// }

export function mountConditional(nodePod: _NodePod, component: InternalComponent, parent: Element, dynamicPod: _DynamicNodePod, nodeEntities: NodeEntity[]) {
    const fragment = new DocumentFragment();

    for (const nodeEntity of nodeEntities) {
        setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment) //TODO: pass in index in case it's in a list?
    }

    let prevSibling = dynamicPod.prevNode;
    if (prevSibling && prevSibling === parent) parent.append(fragment) //for teleport
    else if (prevSibling) prevSibling.after(fragment)
    else parent.prepend(fragment)
}


function nullNodeRefValues(nodePod: _NodePod, components: InternalComponent[]) {
    nodePod.forEachNode(node => {
        const ref = getNodeRef(node);
        if (ref && ref.o()) ref.setValue(undefined)
    })
    for (const component of components) {
        const ref = getNodeRef(component.component);
        if (ref && ref.o()) ref.setValue(null)
    }
}

// function restoreNodeRefValues(nodePod: _NodePod, components: InternalComponent[]) {
//     nodePod.forEachNode((node, index) => {
//         const ref = getNodeRef(node);
//         if (ref) {
//             if (index === undefined) ref.setValue(node);
//             else ref.insertNode(node, index);
//         }
//     })
//     // for (const component of components){ //NOTE: Deferred until needed: nulling and restoring node ref for components. Getting the correct index is tricky.
//     //     const ref = getNodeRef(component.component);
//     //     if (ref && ref.o.value) ref.setValue(component.component)
//     // }
// }

function emitActivated(components: InternalComponent[]) { //FIX: these should be dynamic nodes
    for (const component of components) {
        if (component.preserve) component.emit(LifecycleHook.ACTIVATED);
    }
}


