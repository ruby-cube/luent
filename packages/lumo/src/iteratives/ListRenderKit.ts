import { Ion, isAnyIon, isIonicModel, Ion, IonicModel, toRaw, shallowClone, ReactiveGet, isIon, asMetaIon, Phase, DerivedIon, __devCheckIfTracked, ionize } from "../../../quarky/src";
import { InternalComponent } from "../component/InternalComponent";
import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { Collection, ListData, RenderItem } from "./For";
import { popList, pushList } from "./listStack";
import { makeDynamicNode } from "../dynamic/makeDynamicNode";
import { normalizeToArray } from "@rue/utils";
import { mountNodeEntity } from "../node/mountNodeEntity";
import { DynamicNode } from "../dynamic/DynamicNode";
import { watch } from "../watch/watchAndPreserve";
import { diff, InsertAndMoveKit } from "./diff";
import { Sign } from "crypto";
import { META } from "../../../quarky/src/ReactiveEntity";
import { popProvider, pushProvider } from "../component/provide";
import { getActiveDynamicNode, popDynamicNode, pushDynamicNode } from "../dynamic/nodestack";


type Index = number
type Count = number

const dynamicNodeMap: WeakMap<_NodePod, DynamicNode> = new WeakMap()

// let currentItem: any;
let $currentIndex: Ion<number> | undefined;

export function getCurrentIndex(): Ion<number> | undefined {
    return $currentIndex
}

export function setCurrentIndex($index: Ion<number> | undefined) {
    // currentItem = item;
    $currentIndex = $index;
}

export class ListRenderKit<T = any> {
    constructor(
        public renderItem: RenderItem<T>, //QUESTION: Does this need the context object?
        public data: Collection<T> | IonicModel<Collection<T>> | ReactiveGet<Collection<T>>,
        public provider: InternalComponent,
        public idKey: string | undefined
    ) { }

    isUpdating = false;

    runUpdate(update: () => void) {
        this.isUpdating = true;
        update();
        this.isUpdating = false;
    }


    afterUpdateTasks: Set<Function> = new Set()

    castUpdated(toFromIndices: [number, number][]) {
        for (const task of this.afterUpdateTasks) {
            task(toFromIndices)
        }
    }

    private dynamicNodePod: _DynamicNodePod | undefined

    mount(
        parent: Element,
        nodePod: _NodePod,
        fragment?: DocumentFragment,
    ) {
        const data = this.data
        const renderItem = this.renderItem
        const idKey = this.idKey
        const provider = this.provider
        if (__DEV__) __devCheckIfTracked()
        const list = isAnyIon(data) ? data() : <Collection<any>>data;
        const _list = list instanceof Array ? list : list //TODO: need to implement for sets, maps, and objects
        const _isIonicModel = isIonicModel(data)
        const isDynamic = _isIonicModel || isAnyIon(data);
        const dynamicNodePod = this.dynamicNodePod = isDynamic ? nodePod.appendDynamicPod() : undefined;
        const indices: Ion<number>[] = []


        pushList(this);
        for (let i = 0; i < _list.length; i++) {
            const $index = Ion(i)
            const item = _list[i]
            // currentItem = item;
            $currentIndex = $index;
            indices.push($index)

            nodePod = isDynamic ? dynamicNodePod!.appendNodePod() : nodePod;
            if (isDynamic) {
                const dynamicNode = makeDynamicNode(false, nodePod)
                dynamicNode.activate(function mountDynamicItem() {
                    pushProvider(provider)
                    const nodeEntities = normalizeToArray(renderItem(item, $index))
                    for (const nodeEntity of nodeEntities) {
                        mountNodeEntity(parent, nodeEntity, nodePod, fragment);
                    }
                    popProvider()
                })
                // dynamicNode.setNodePod(nodePod)
                dynamicNodeMap.set(nodePod, dynamicNode)
            }
            else {
                pushProvider(provider)
                const nodeEntities = normalizeToArray(renderItem(item, $index))
                for (const nodeEntity of nodeEntities) {
                    mountNodeEntity(parent, nodeEntity, nodePod, fragment);
                }
                popProvider()
            }
        }

        // [node, node, [[node, [node, node]], [node, [node]], [node, [node]]], ]

        data
        if (isDynamic) {
            const dynamicIndices = new DynamicIndices(indices)
            // set up watcher for updates
            // const renderCycle = getCurrentRenderCycle();
            const parentDynamicNode = getActiveDynamicNode()
            pushProvider(provider)
            const rawData = isIonicModel(data) ? toRaw(data) : undefined
            let clone = isIonicModel(data) ? shallowClone(rawData!) : undefined
            watch(<DerivedIon>data, (newValue: any[], oldValue: any[]) => { // typecast as one of the options so that typescript won't complain
                const _oldValue = clone || oldValue;
                if (_isIonicModel) clone = shallowClone(rawData!) as any[]
                const { indicesToRemove, insertAndMoveKit, noChange } = diff(rawData || newValue, _oldValue, idKey)
                if (noChange) return;
                if (dynamicNodePod!.length !== _oldValue.length)
                    throw new Error(`dynamicPod length ${dynamicNodePod!.length} and data length ${oldValue.length} are mismatched. This should never happen.`)
                this.runUpdate(() => {
                    pushDynamicNode(parentDynamicNode!)
                    pushProvider(provider)
                    // component.emit(LifecycleHook.BEFORE_UPDATE) //FIX: this should be called in before render and afterRender hooks
                    this.removeItems(indicesToRemove!);
                    this.insertAndMoveItems(insertAndMoveKit!, parent, dynamicIndices)
                    // component.emit(LifecycleHook.ON_UPDATED)
                    popProvider()
                    popDynamicNode()
                })
            }, { phase: Phase.RENDER })
            popProvider()
        }
        // currentItem = undefined;
        $currentIndex = undefined;
        popList();

    }

    private removeItems(indicesToRemove: number[]) {
        // remove from DOM
        for (const index of indicesToRemove) {
            const nodePod = this.dynamicNodePod![index];
            const dynamicNode = dynamicNodeMap.get(nodePod)
            dynamicNode?.destroy()
        }
    }

    private insertAndMoveItems(
        insertAndMoveKit: InsertAndMoveKit,
        parent: Element,
        dynamicIndices: DynamicIndices,
    ) {
        const { getOriginalItem, isNewItem, hasMoved, newUArray, oldUArray, isRemoved } = insertAndMoveKit;
        const dynamicNodePod = this.dynamicNodePod!
        if (dynamicNodePod.length !== oldUArray.length) throw new Error("dynamicPod and data length are mismatched")
        const indicesAndNodePods: [number, _NodePod[]][] = []
        const indicesAndFragments: [number, DocumentFragment][] = []
        let fragment = new DocumentFragment();

        const newIndices: Ion<number>[] = [];
        const toFromIndices: [number, number][] = []

        for (let i = 0; i < newUArray.length; i++) {
            const uItem = newUArray[i];
            const _isNewItem = isNewItem(uItem);
            const _itemHasMoved = hasMoved(uItem);
            const prevIndex = oldUArray.indexOf(uItem)
            const nodePod = _isNewItem ? new _NodePod()
                : _itemHasMoved ? dynamicNodePod[prevIndex] // dynamicNodePod[index]
                    : null;

            if (!_isNewItem) {
                // update $index value
                const $index = dynamicIndices.current[prevIndex];
                newIndices.push($index);
                $index.set(i)

                // to update refs
                toFromIndices.push([i, prevIndex]);
            };

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
                const $index = Ion(i)
                setCurrentIndex($index); // to retreive config
                newIndices.push($index);
                // create and collect consecutive new items onto the same fragment

                const dynamicNode = makeDynamicNode(false, nodePod)
                const renderItem = this.renderItem
                pushProvider(this.provider)
                pushList(this)
                const list = this.data;
                const _item = isIonicModel(list) || isIon(list) && asMetaIon(list).hasIonicValue ? ionize(item) : item; //TODO: what about DerivedSignals that output a deep reactive?
                dynamicNode.activate(function renderNewListItem() {
                    const nodeEntities = normalizeToArray(renderItem(_item, $index));
                    for (const nodeEntity of nodeEntities!) {
                        mountNodeEntity(parent, nodeEntity, nodePod, fragment)
                    }
                })
                setCurrentIndex(undefined)
                popList();
                popProvider()
                dynamicNodeMap.set(nodePod, dynamicNode)
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
            dynamicNodePod!.removeNodePods(index, count);

        }

        // (2) insert node pods into dynamic list
        for (const [index, nodePods] of indicesAndNodePods) {
            dynamicNodePod.insertNodePods(index, nodePods)
        }

        // (3) insert nodes into DOM
        for (const [index, fragment] of indicesAndFragments) {
            const prevNode = dynamicNodePod[index].prevNode
            if (prevNode && prevNode === parent) parent.append(fragment) // for teleport
            else if (prevNode) prevNode.after(fragment);
            else parent.prepend(fragment);
        }

        this.castUpdated(toFromIndices)

        // (4) update node refs
        // for (const [_, nodePods] of indicesAndNodePods) {
        //     console.log('nodePods',nodePods)
        //     for (const nodePod of nodePods) {
        //         nodePod.forEachNode((node, index) => {
        //             const ref = getNodeArrayRef(node); //FIX: THis is broken .. this only assigns a ref to the root nodes of a list
        //             console.log("inserting node into ref!", ref)
        //             if (ref) ref.insertNode(<Element>node, index!)
        //                 if (ref) console.log(ref.o)
        //         })
        //     }
        // }
    }
}

export class DynamicIndices {
    current: Ion<number>[];
    constructor(indices: Ion<number>[]) {
        this.current = indices
    }
    update(newIndices: Ion<number>[]) {
        this.current = newIndices
    }
}






// function removeNodesFromRef(nodePod: _NodePod) {
//     nodePod.forEachNode((node, index) => {
//         const ref = getNodeArrayRef(node)
//         if (ref) ref.removeNode(index!) //TODO: This
//     })
// }



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
