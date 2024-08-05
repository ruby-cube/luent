import { hasSignal, isReactiveModel, Signal, useSignals } from "@rue/muonic";
import { InternalComponent, popComponent, pushComponent } from "../component/component";
import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { _listReactivity, DynamicIndices, ListRenderKit, RenderItem, setCurrentItemAndIndex } from "./forEachIn";
import { setUpNodeEntity } from "../node/setUpNodeEntity";
import { watchForRenderAndPreserve } from "../conditional/$if";
import { watchForRender } from "../reactivity/watchForRender";
import { AnyObject } from "@rue/types";
import { diff, InsertAndMoveKit } from "./diff";
import { LifecycleHook } from "../component/lifecycle";
import { getNodeRef } from "../node/NodeRef";
import { normalizeToArray } from "@rue/utils";
import { emitHookBatch, removeDOMNodes } from "../conditional/setUpConditionalMount";
import { collectEffects, Flask, getActiveFlask } from "@rue/flask";
import { getCurrentUpdateCycle } from "@rue/muonic/UpdateCycle";
import { NodeEntity } from "../node/makeNode";


export function setUpNodeList(
    component: InternalComponent,
    parent: Element,
    renderKit: ListRenderKit,
    nodePod: _NodePod,
    fragment?: DocumentFragment,
    componentsToUnmount?: InternalComponent[],
) {
    const { data, initialNodeEntities, renderItem, indices, idKey, flasks } = renderKit;
    const isDynamic = isReactiveModel(data) || hasSignal(data);
    const dynamicPod = isDynamic ? nodePod.appendDynamicPod() : undefined;


    for (let i = 0; i < initialNodeEntities.length; i++) {
        const nodeEntities = initialNodeEntities[i];
        nodePod = isDynamic ? dynamicPod!.appendNodePod() : nodePod;
        if (isDynamic) {
            const flask = flasks[i];
            nodePod.setFlask(flask)
            flask.collectEffects(() => {
                for (const nodeEntity of nodeEntities) {
                    setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment, componentsToUnmount);
                }
            })
        }
        else {
            for (const nodeEntity of nodeEntities) {
                setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment, componentsToUnmount);
            }
        }
    }

    // [node, node, [[node, [node, node]], [node, [node]], [node, [node]]], ]

    if (isDynamic) {
        const dynamicIndices = new DynamicIndices(indices)
        const _watchForRender = component.preserve ? watchForRenderAndPreserve : watchForRender //TODO: Not sure if I need this yet

        // set up watcher for updates
        const updateCycle = getCurrentUpdateCycle();
        _watchForRender(data, (newValue: AnyObject[], oldValue: AnyObject[]) => {
            if (updateCycle === getCurrentUpdateCycle()) {
                console.warn("prevented same update cycle")
                return;
            }
            const { indicesToRemove, insertAndMoveKit, noChange } = diff(newValue, oldValue, idKey)
            if (noChange) return;
            if (dynamicPod!.length !== oldValue.length) throw new Error(`dynamicPod length ${dynamicPod!.length} and data length ${oldValue.length} are mismatched. This should never happen.`)
            pushComponent(component)
            component.emit(LifecycleHook.BEFORE_UPDATE)
            removeListItemNodes(dynamicPod!, indicesToRemove!);
            insertAndMoveListItemNodes(component, insertAndMoveKit!, dynamicPod!, parent, renderItem, dynamicIndices)
            component.emit(LifecycleHook.UPDATED)
            popComponent()
        })
    }
}



export function removeListItemNodes(dynamicList: _DynamicNodePod, indicesToRemove: number[]) {
    // remove from DOM
    for (const index of indicesToRemove) {
        const nodePod = dynamicList[index];
        const components = nodePod.componentsToUnmount;
        emitHookBatch(LifecycleHook.BEFORE_UNMOUNT, components!)
        removeDOMNodes(nodePod)
        removeNodesFromRef(nodePod)
        nodePod.flask!.dispose();
        emitHookBatch(LifecycleHook.UNMOUNTED, components!)
    }
}

function removeNodesFromRef(nodePod: _NodePod) {
    nodePod.forEachNode((node, index) => {
        const ref = getNodeRef(node)
        if (ref) ref.removeNode(index!)
    })
}


type Index = number
type Count = number

export function insertAndMoveListItemNodes(
    component: InternalComponent,
    insertAndMoveKit: InsertAndMoveKit,
    dynamicList: _DynamicNodePod,
    parent: Element,
    renderItem: RenderItem,
    dynamicIndices: DynamicIndices,
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
            _listReactivity.set($index, () => i)
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
            const item = getOriginalItem(uItem, newUArray)
            const $index = _listReactivity.$(i)
            setCurrentItemAndIndex(item, $index); // to retreive config
            newIndices.push($index);
            // create and collect consecutive new items onto the same fragment
            let nodeEntities;
            collectEffects((flask, outerFlask) => {
                nodeEntities = normalizeToArray(renderItem(item, $index));
                for (const nodeEntity of nodeEntities!) {
                    setUpNodeEntity(component, parent, nodeEntity, nodePod, fragment, nodePod.componentsToUnmount)
                }
                nodePod.setFlask(flask);
                outerFlask?.onDisposal(flask.dispose)
            })
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

    // (2) insert node pods into dynamic list
    for (const [index, nodePods] of indicesAndNodePods) {
        dynamicList.insertNodePods(index, nodePods)
    }

    // (3) insert nodes into DOM
    for (const [index, fragment] of indicesAndFragments) {
        const prevNode = dynamicList[index].prevNode
        if (prevNode && prevNode === parent) parent.append(fragment) // for teleport
        else if (prevNode) prevNode.after(fragment);
        else parent.prepend(fragment);
    }

    // (4) update node refs
    for (const [_, nodePods] of indicesAndNodePods) {
        for (const nodePod of nodePods) {
            nodePod.forEachNode((node, index) => {
                const ref = getNodeRef(node);
                if (ref) ref.insertNode(<Element>node, index!)
            })
        }
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
