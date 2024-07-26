import { AnyObject } from "@rue/types";
import { hasSignal, ReactiveSignal } from "../../muonic/useDerivedSignal";
import { _internalReactivity, emitHookBatch, setUpNodeEntity } from "./mE";
import { isReactive, ReactiveObject } from "../../muonic/useReactivize";
import { _DynamicNodePod, _NodePod } from "./NodePod";
import { Signal } from "../../muonic/useSignalize";
import { LifecycleHook } from "./lifecycle";
import { InternalComponent, popComponent, pushComponent } from "./component";
import { InsertAndMoveKit } from "./diff";
import { getNodeRef } from "./NodeRef";
import { NodeEntity } from "./makeNode";
import { normalizeToArray } from "@rue/utils";


export type RenderItem<T = any> = (item: T, $index: Signal<number>) => NodeEntity[] | NodeEntity
// type ListData = AnyObject | any[] | Set<any> | Map<any, any> | ReactiveObject<AnyObject[] | Set<any> | Map<any, any> | AnyObject> //TODO: Implement for maps, sets, and objects. Not sure about updating behavior. What about strings and iterating over characters?
export type ListData = any[] | ReactiveObject<AnyObject[] | UniqueItem[]> | ReactiveSignal<AnyObject[] | UniqueItem>
export type UniqueItem = any;

export class ListRenderKit<T = any> {
    constructor(
        public renderItem: RenderItem<T>, //QUESTION: Does this need the context object?
        public initialNodeEntities: NodeEntity[][],
        public data: ListData,
        public indices: Signal<number>[]
    ) { }
}

// let settingUpList: boolean = false;
let currentItem: any;
let $currentIndex: Signal<number> | undefined;

export function getCurrentItemAndIndex(): [any, Signal<number>] | [undefined, undefined] {
    if ($currentIndex === undefined) return [undefined, undefined]
    return [currentItem, $currentIndex]
}

export function setCurrentItemAndIndex(item: any, $index: Signal<number>) {
    currentItem = item;
    $currentIndex = $index;
}

// export function isSettingUpList() {
//     return settingUpList;
// }

export function forEachIn(data: any[], render: RenderItem): ListRenderKit // static list
export function forEachIn(data: ReactiveObject<UniqueItem[]> | ReactiveSignal<UniqueItem[]>, render: RenderItem): ListRenderKit // dynamic list
export function forEachIn(data: ReactiveObject<AnyObject[]> | ReactiveSignal<AnyObject>, render: RenderItem): ListRenderKit // dynamic list
export function forEachIn(data: ListData, render: RenderItem): ListRenderKit {
    const domNodes = [];
    const list = hasSignal(data) ? data() : data;

    const indices = []

    // settingUpList = true;
    let i = 0;
    while (i < list.length) {
        const $index = _internalReactivity.$(i)
        const item = list[i]
        currentItem = item;
        $currentIndex = $index;
        indices.push($index)
        domNodes.push(normalizeToArray(render(item, $index)));
        i++;
    }
    currentItem = undefined;
    $currentIndex = undefined;
    // settingUpList = false;

    return new ListRenderKit(render, domNodes, data, indices);
}


export class DynamicIndices {
    current: Signal<number>[];
    constructor(indices: Signal<number>[]) {
        this.current = indices
    }
    update(newIndices: Signal<number>[]) {
        this.current = newIndices
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
        emitHookBatch(LifecycleHook.UNMOUNTED, components!)
    }
}

function removeDOMNodes(nodePod: _NodePod) {
    nodePod.forEachNode((node) => {
        node.remove();
    })
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
            const item = getOriginalItem(uItem)
            const $index = _internalReactivity.$(i)
            setCurrentItemAndIndex(item, $index); // to retreive config
            newIndices.push($index);
            // create and collect consecutive new items onto the same fragment
            pushComponent(component)
            const nodeEntities = normalizeToArray(renderItem(item, $index));
            popComponent()
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

    // (2) insert node pods into dynamic list
    for (const [index, nodePods] of indicesAndNodePods) {
        dynamicList.insertNodePods(index, nodePods)
    }

    // (3) insert nodes into DOM
    for (const [index, fragment] of indicesAndFragments) {
        const prevNode = dynamicList[index].prevNode
        if (prevNode) prevNode.after(fragment);
        parent.prepend(fragment);
    }

    // (4) update node refs
    for (const [_, nodePods] of indicesAndNodePods) {
        for (const nodePod of nodePods) {
            nodePod.forEachNode((node, index) => {
                const ref = getNodeRef(node);
                if (ref) ref.insertNode(node, index!)
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

