import { Signal } from "../muonic/useSignalize";
import { InternalComponent, setCurrentComponent } from "./component";
import { InsertAndMoveKit } from "./diff";
import { LifecycleHook } from "./lifecycle";
import { _internalReactivity, DynamicIndices, emitHookBatch, normalizeRenderOutput, removeDOMNodes, setUpNodeEntity } from "./mX";
import { RenderItem } from "./mXsFor";
import { _DynamicNodePod, _NodePod } from "./NodePod";


export function removeListItemNodes(dynamicList: _DynamicNodePod, indicesToRemove: number[]) {
    // remove from DOM
    for (const index of indicesToRemove) {
        const nodePod = dynamicList[index];
        const components = nodePod.componentsToUnmount;
        emitHookBatch(LifecycleHook.PREUNMOUNT, components!)
        removeDOMNodes(dynamicList[index])
        emitHookBatch(LifecycleHook.UNMOUNTED, components!)
    }
}

type Index = number
type Count = number

export function insertAndMoveListItemNodes(
    component: InternalComponent,
    insertAndMoveKit: InsertAndMoveKit,
    dynamicList: _DynamicNodePod,
    parent: HTMLElement,
    renderItem: RenderItem,
    dynamicIndices: DynamicIndices
) {
    const { getOriginalItem, isNewItem, hasMoved, newUArray, oldUArray, isRemoved } = insertAndMoveKit;
    if (dynamicList.length !== oldUArray.length) throw "dynamicPod and data length are mismatched"
    const indicesAndNodePods: [number, _NodePod[]][] = []
    const indicesAndFragments: [number, DocumentFragment][] = []
    let fragment = new DocumentFragment();

    const newIndices: Signal<number>[] = [];

    for (let i = 0; i < newUArray.length; i++) {
        const uItem = newUArray[i];
        const _isNewItem = isNewItem(uItem);
        const _itemHasMoved = hasMoved(uItem);
        const prevIndex = oldUArray.indexOf(uItem)
        const nodePod = _isNewItem ? new _NodePod()
            : _itemHasMoved ? dynamicList[prevIndex] // dynamicList[index]
                : null;

        if (!_isNewItem) {
            // get index from old indices 
            const $index = dynamicIndices.current[prevIndex];
            newIndices.push($index);
            _internalReactivity.set($index, () => i) //TODO: I don't know if it's okay to set a Signal inside an effect...
        }; // item is not new and has not moved

        if (!nodePod) continue;
        const prevEntry = indicesAndNodePods.at(-1);
        if (prevEntry && prevEntry[0] + 1 === i) {
            prevEntry[1].push(nodePod); // include nodePod for re/insertion
        }
        else {
            indicesAndNodePods.push([i, [nodePod]]) // create new batch of nodePods for re/insertion
            fragment = new DocumentFragment();
            indicesAndFragments.push([i, fragment]) // queue fragment for mounting
        }

        if (isNewItem(uItem)) {
            const $index = _internalReactivity.$(i)
            newIndices.push($index);
            // create and collect consecutive new items onto the same fragment
            setCurrentComponent(component)
            const nodeEntities = normalizeRenderOutput(renderItem(getOriginalItem(uItem), $index));
            setCurrentComponent(null)
            for (const nodeEntity of nodeEntities) {
                setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment, nodePod.componentsToUnmount)
            }
        }
        else if (hasMoved(uItem)) {
            // move node to fragment (DOM will auto-remove node from DOM)
            appendNodes(fragment, nodePod);
        }
    }
    dynamicIndices.update(newIndices)

    // queue nodePod removal
    const indicesAndRemoveCount: [Index, Count][] = [];
    let j = 0;
    while (j < oldUArray.length) {
        const id = oldUArray[j];
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

    // (3) update data-attribute index //TODO:

    // (4) insert nodes into DOM
    for (const [index, fragment] of indicesAndFragments) {
        const prevNode = dynamicList[index].prevNode
        if (prevNode) prevNode.after(fragment);
        parent.prepend(fragment);
    }
}

function appendNodes(fragment: DocumentFragment, nodePod: _NodePod) {
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

