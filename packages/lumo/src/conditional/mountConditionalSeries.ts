import { InternalComponent } from "../component/InternalComponent";
import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { watchForRender } from "../watch/watchForRender";
import { LifecycleHook } from "../component/lifecycle";
import { NodeEntity } from "../node/makeNode";
import { getNodeRef } from "../node/$Node";
import { areShallowEqualArrays, getDependencyTracker, getWithoutTracking, isShallowEqual } from "@rue/muonic";
import { ConditionalRenderSeries } from "./ConditionalRenderSeries";
import { popComponent, pushComponent } from "../component/componentStack";
import { LifecycleHook as DynamicLifecycleHook } from "../dynamic/lifecycle";
import { DynamicNode, getActiveDynamicNode, popDynamicNode, pushDynamicNode } from "../dynamic/DynamicNode";
import { Fragment } from "@rue/jsx-runtime";

export function mountConditionalSeries(
    component: InternalComponent,
    parent: Element,
    series: ConditionalRenderSeries,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
) {
   
}

// export function emitHookBatch(hookName: LifecycleHook, components: InternalComponent[] | undefined) {
//     if (!components) return;
//     for (const compo of components) {
//         compo.emit(hookName);
//     }
// }

// function iterate_overNodePod(nodePod: _NodePod, doTask: (node: DOMNode) => void) {

// }




// export function populateFragment(fragment: DocumentFragment, nodePod: _NodePod) {
//     nodePod.forEachNode((node) => {
//         fragment.appendChild(node)
//     })
// }

// const preservedNodePods: WeakMap<RenderConditional, _NodePod> = new WeakMap();

// function getPreservedNodePod(renderConditional: RenderConditional) {
//     const nodePod = preservedNodePods.get(renderConditional)
//     if (!nodePod) throw new Error("nodePod missing")
//     return nodePod;
// }

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




