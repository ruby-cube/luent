import { InternalComponent } from "./component";
import { InsertAndMoveKit } from "./diff";
import { LifecycleHook } from "./lifecycle";
import { emitHookBatch, removeDOMNodes, setUpNodeEntity } from "./mx";
import { RenderItem } from "./mxsFor";
import { DynamicNodePod, NodePod } from "./NodePod";


export function removeListItemNodes(component: InternalComponent, dynamicList: DynamicNodePod, removeKit: { indicesToRemove: number[], indicesAndRemoveCount: [number, number][] }) {
    const { indicesAndRemoveCount, indicesToRemove } = removeKit;

    // remove from DOM
    component.emit(LifecycleHook.BEFORE_UPDATE)
    for (const index of indicesToRemove) {
        const nodePod = dynamicList[index];
        const components = nodePod.componentsToUnmount;
        emitHookBatch(LifecycleHook.BEFORE_UNMOUNT, components!)
        removeDOMNodes(dynamicList[index])
        emitHookBatch(LifecycleHook.UNMOUNTED, components!)
    }
    component.emit(LifecycleHook.UPDATED)

    // remove from node pod
    let i = indicesAndRemoveCount.length; // loop through backwards to avoid having to recalculate index
    while (i--) {
        const [index, count] = indicesAndRemoveCount[i];
        dynamicList!.removeNodePods(index, count);
    }
}



export function insertAndMoveListItemNodes(component: InternalComponent, insertAndMoveKit: InsertAndMoveKit, dynamicList: DynamicNodePod, parent: HTMLElement, renderItem: RenderItem) {
    const { getItem, isNewItem, itemHasMoved, newArrayAsIDs } = insertAndMoveKit;
    const nodes = parent.childNodes;
    if (dynamicList.length !== newArrayAsIDs.length) throw "dynamicPod and data length are mismatched"
    const indicesAndNodePods: [number, NodePod[]][] = []
    const indicesAndFragments: [number, DocumentFragment][] = []
    let fragment = new DocumentFragment();

    let i = 0
    while (i < newArrayAsIDs.length) {
        const id = newArrayAsIDs[i];
        if (isNewItem(id)) { // collect consecutive new items onto the same fragment
            const nodeEntities = renderItem(getItem(id), i);
            const nodePod = new NodePod();

            const prevEntry = indicesAndNodePods.at(-1);
            if (prevEntry && prevEntry[0] + 1 === i) {
                prevEntry[1].push(nodePod);
            }
            else {
                indicesAndNodePods.push([i, [nodePod]])
                fragment = new DocumentFragment();
                indicesAndFragments.push([i, fragment])
            }

            for (const nodeEntity of nodeEntities) {
                setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment, nodePod.componentsToUnmount)
            }
        }
        else if (itemHasMoved(id)) {
            // move node
            //TODO: append existing nodes to fragment
            const prevNode = nodes.item(i - 1);
            if (prevNode) {
                prevNode.after(nodes.item(i))
            }
            else {
                parent.prepend(nodes.item(i))
            }
        }
    }

    // (1) insert nodes into node pods
    for (const [index, nodePods] of indicesAndNodePods) {
        dynamicList.insertNodePods(index, nodePods)
    }

    // (2) insert nodes into DOM
    component.emit(LifecycleHook.BEFORE_UPDATE) //TODO: make sure this surrounds the item moving loop
    for (const [index, fragment] of indicesAndFragments) {
        const prevNode = dynamicList[index].prevNode
        if (prevNode) prevNode.after(fragment);
        parent.prepend(fragment);
    }
    component.emit(LifecycleHook.UPDATED)
}