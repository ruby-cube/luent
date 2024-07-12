import { InternalComponent } from "./component";
import { InsertAndMoveKit } from "./diff";
import { LifecycleHook } from "./lifecycle";
import { emitHookBatch, removeDOMNodes, setUpNodeEntity } from "./mx";
import { RenderItem } from "./mxsFor";
import { DynamicNodePod, NodePod } from "./NodePod";


export function removeListItemNodes(dynamicList: DynamicNodePod, indicesToRemove: number[]) {
    // remove from DOM
    for (const index of indicesToRemove) {
        const nodePod = dynamicList[index];
        const components = nodePod.componentsToUnmount;
        emitHookBatch(LifecycleHook.BEFORE_UNMOUNT, components!)
        removeDOMNodes(dynamicList[index])
        emitHookBatch(LifecycleHook.UNMOUNTED, components!)
    }
}

type Index = number
type Count = number

export function insertAndMoveListItemNodes(component: InternalComponent, insertAndMoveKit: InsertAndMoveKit, dynamicList: DynamicNodePod, parent: HTMLElement, renderItem: RenderItem) {
    const { getItem, isNewItem, hasMoved, newArrayAsIDs, oldArrayAsIDs, isRemoved } = insertAndMoveKit;
    if (dynamicList.length !== newArrayAsIDs.length) throw "dynamicPod and data length are mismatched"
    const indicesAndNodePods: [number, NodePod[]][] = []
    const indicesAndFragments: [number, DocumentFragment][] = []
    let fragment = new DocumentFragment();

    let i = 0
    while (i < newArrayAsIDs.length) {
        const id = newArrayAsIDs[i];
        const _isNewItem = isNewItem(id);
        const _itemHasMoved = hasMoved(id);
        const nodePod = _isNewItem ? new NodePod()
            : _itemHasMoved ? dynamicList[oldArrayAsIDs.indexOf(id)] // dynamicList[index]
                : null;

        if (!nodePod) continue; // item is not new and has not moved

        const prevEntry = indicesAndNodePods.at(-1);
        if (prevEntry && prevEntry[0] + 1 === i) {
            prevEntry[1].push(nodePod); // include nodePod for re/insertion
        }
        else {
            indicesAndNodePods.push([i, [nodePod]]) // create new batch of nodePods for re/insertion
            fragment = new DocumentFragment();
            indicesAndFragments.push([i, fragment]) // queue fragment for mounting
        }

        if (isNewItem(id)) {
            // create and collect consecutive new items onto the same fragment
            const nodeEntities = renderItem(getItem(id), i);
            for (const nodeEntity of nodeEntities) {
                setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment, nodePod.componentsToUnmount)
            }
        }
        else if (hasMoved(id)) {
            // move node to fragment (DOM will auto-remove node from DOM)
            appendNodes(fragment, nodePod);
        }
    }

    // queue nodePod removal
    const indicesAndRemoveCount: [Index, Count][] = [];
    let j = 0;
    while (j < oldArrayAsIDs.length) {
        const id = oldArrayAsIDs[j];
        if (isRemoved(id) || hasMoved(id)) {
            const prevEntry = indicesAndRemoveCount.at(-1);
            if (prevEntry && prevEntry[0] + 1 === j) {
                prevEntry[1]++; // increment count
            }
            else {
                indicesAndRemoveCount.push([j, 1])
            }
        }
        j++;
    }

    // (1) remove nodePods 
    let k = indicesAndRemoveCount.length; // loop through backwards to avoid having to recalculate index
    while (k--) {
        const [index, count] = indicesAndRemoveCount[k];
        dynamicList!.removeNodePods(index, count);
    }

    // (2) insert nodes into node pods
    for (const [index, nodePods] of indicesAndNodePods) {
        dynamicList.insertNodePods(index, nodePods)
    }

    // (3) insert nodes into DOM
    for (const [index, fragment] of indicesAndFragments) {
        const prevNode = dynamicList[index].prevNode
        if (prevNode) prevNode.after(fragment);
        parent.prepend(fragment);
    }
}

function appendNodes(fragment: DocumentFragment, nodePod: NodePod) {
    for (const nodeOrPod of nodePod) {
        if (nodeOrPod instanceof Node) {
            fragment.appendChild(nodeOrPod)
        }
        else {
            for (const nodePod of nodeOrPod) {
                appendNodes(fragment, nodePod)
            }
        }
    }
}

