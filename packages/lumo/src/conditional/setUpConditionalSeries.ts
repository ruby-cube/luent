import { isEqual } from "@rue/utils";
import { InternalComponent, popComponent, pushComponent } from "../component/component";
import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { setUpNodeEntity } from "../node/setUpNodeEntity";
import { watchForRender } from "../reactivity/watchForRender";
import { ConditionalSeries, RenderConditional, watchForRenderAndPreserve } from "./$if";
import { LifecycleHook } from "../component/lifecycle";
import { NodeEntity } from "../node/makeNode";
import { getNodeRef } from "../node/NodeRef";

export function setUpConditionalSeries(
    component: InternalComponent,
    parent: Element,
    series: ConditionalSeries,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
) {
    // evaluate conditions and render
    const { $conditions, activeIndex } = series.evaluateConditions()
    const initialNodeEntities = series.render(activeIndex)

    // append to dom and node pod
    const dynamicPod = nodePod.appendDynamicPod();
    const _nodePod = dynamicPod.appendNodePod()
    for (const nodeEntity of initialNodeEntities) {
        setUpNodeEntity(component, parent, nodeEntity, _nodePod, fragment, nodePod.componentsToUnmount)
    }

    // set up watcher for updates
    const _watchForRender = component.preserve ? watchForRenderAndPreserve : watchForRender
    _watchForRender($conditions, updateConditional, { once: true })

    function updateConditional(newValue: boolean[], oldValue: boolean[]) {
        console.log("update conditional")
        if (isEqual(newValue, oldValue)) return;
        pushComponent(component)

        // evaluate conditions
        const { $conditions, activeIndex } = series.evaluateConditions();

        // render and add/remove node pods
        component.emit(LifecycleHook.BEFORE_UPDATE)
        removePrevConditionalNodes(dynamicPod);
        const nodeEntities = series.render(activeIndex)
        console.log("nodeEntities", nodeEntities, activeIndex, series)
        insertNewConditionalNodes(component, parent, dynamicPod, nodeEntities)
        component.emit(LifecycleHook.UPDATED)

        // set up for next update
        _watchForRender($conditions, updateConditional, { once: true })
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

export function removeDOMNodes(nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        node.remove();
    })
}


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

function removePrevConditionalNodes(dynamicPod: _DynamicNodePod) {
    // component === App
    // const preserve = component.preserve;
    const nodePod = dynamicPod[0];
    const components = nodePod.componentsToUnmount;

    // if (preserve) {
    //     preservedNodePods.set(renderConditional, nodePod) // I don't think this is necessary...
    // }
    // else {
    emitBeforeUnmount(components)
    // }

    removeDOMNodes(nodePod)
    nullNodeRefValues(nodePod, components)
    // emitHookBatch(preserve ? LifecycleHook.DEACTIVATED : LifecycleHook.UNMOUNTED, components)
    emitUnmountedOrDeactivated(components)
    // dynamicPod.replaceNodePod(0, new _NodePod()); // clears previous
}

function emitUnmountedOrDeactivated(components: InternalComponent[]) {
    for (const component of components) {
        if (component.preserve) component.emit(LifecycleHook.DEACTIVATED);
        else component.emit(LifecycleHook.UNMOUNTED);
    }
}

function emitBeforeUnmount(components: InternalComponent[]) {
    for (const component of components) {
        if (component.preserve) continue;
        component.emit(LifecycleHook.BEFORE_UNMOUNT);
    }
}



function insertNewConditionalNodes(component: InternalComponent, parent: Element, dynamicPod: _DynamicNodePod, nodeEntities: NodeEntity[]) {
    // const nodePod = preserve ? getPreservedNodePod(renderConditional) : new _NodePod();
    const nodePod = new _NodePod();
    dynamicPod.replaceNodePod(0, nodePod);
    mountConditional(nodePod, component, parent, dynamicPod, nodeEntities);

    emitActivated(nodePod.componentsToUnmount)
    restoreNodeRefValues(nodePod, nodePod.componentsToUnmount)
}

export function mountConditional(nodePod: _NodePod, component: InternalComponent, parent: Element, dynamicPod: _DynamicNodePod, nodeEntities: NodeEntity[]) {
    const fragment = new DocumentFragment();

    for (const nodeEntity of nodeEntities) {
        setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment, nodePod.componentsToUnmount) //TODO: pass in index in case it's in a list?
    }

    let prevSibling = dynamicPod.prevNode;
    if (prevSibling && prevSibling === parent) parent.append(fragment) //for teleport
    else if (prevSibling) prevSibling.after(fragment)
    else parent.prepend(fragment)
}


function nullNodeRefValues(nodePod: _NodePod, components: InternalComponent[]) {
    nodePod.forEachNode(node => {
        const ref = getNodeRef(node);
        if (ref && ref.o.o) ref.setValue(undefined) 
    })
    // for (const component of components){ //NOTE: Deferred until needed (see note in restoreNodeRefValues)
    //     const ref = getNodeRef(component.component);
    //     if (ref && ref.o.value) ref.setValue(null)
    // }
}

function restoreNodeRefValues(nodePod: _NodePod, components: InternalComponent[]) {
    nodePod.forEachNode((node, index) => {
        const ref = getNodeRef(node);
        if (ref) {
            if (index === undefined) ref.setValue(node);
            else ref.insertNode(node, index);
        }
    })
    // for (const component of components){ //NOTE: Deferred until needed: nulling and restoring node ref for components. Getting the correct index is tricky.
    //     const ref = getNodeRef(component.component);
    //     if (ref && ref.o.value) ref.setValue(component.component)
    // }
}

function emitActivated(components: InternalComponent[]) {
    for (const component of components) {
        if (component.preserve) component.emit(LifecycleHook.ACTIVATED);
    }
}


