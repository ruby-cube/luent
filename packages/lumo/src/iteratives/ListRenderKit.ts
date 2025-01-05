import { isIon, isIonizedModel, ion, Ionized, toRaw, shallowClone, ReactiveGet, isAtomicIon, asMetaIon, Phase, DerivedIon, __devCheckIfTracked, ionize, AtomicIon, toValue, getWithoutTracking } from "@rue/quarky";
import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { Collection, ListData, RenderItem } from "./For";
import { popList, pushList } from "./listStack";
import { makeDynamicNode } from "../dynamic/makeDynamicNode";
import { normalizeToArray } from "@rue/utils";
import { mountNodeEntities } from "../node/mountNodeEntity";
import { DynamicNode } from "../dynamic/DynamicNode";
import { watch } from "../watch/watchAndPreserve";
import { diff, InsertAndMoveKit } from "./diff";
import { getActiveDynamicNode, popDynamicNode, pushDynamicNode } from "../dynamic/nodestack";
import { Context, getContext, popContext, pushContext } from "../context/context-stack";
import { NodeKit, setUpNodeEntities } from "../node/setUpNodeEntities";
import { TransitionNode } from "../transition/TransitionNode";
import { createNodeContext } from "../context/Context";
import { useTransitionNodes } from "../transition/TransitNode";
import { getTrace } from "../../../utils/debug";


type Index = number
type Count = number

type DynamicList<T = any> = Ionized<Collection<T>> | ReactiveGet<Collection<T>>

const dynamicNodeMap: WeakMap<_NodePod, DynamicNode> = new WeakMap()

// let currentItem: any;
let $currentIndex: AtomicIon<number> | undefined;

export function getCurrentIndex(): AtomicIon<number> | undefined {
   return $currentIndex
}

export function setCurrentIndex($index: AtomicIon<number> | undefined) {
   // currentItem = item;
   $currentIndex = $index;
}

function wrapWithContext(renderItem: RenderItem<Ionized<any[]>>, list: ListRenderKit) {
   const outerContext = getContext();
   return (item: any, $index: AtomicIon<number>, parent: Element, nodePod: _NodePod) => {
      const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
      list.transitions.set($index, transitionNodes)
      try {
         pushList(list)
         pushContext(outerContext)
         const nodeEntities = setUpNodeEntities(normalizeToArray(
            createNodeContext(() => renderItem(item, $index), {
               with: { [REGISTER_TRANSITION_NODE]: registerTransitionNode }
            })
         ), parent, nodePod)
         return nodeEntities;
      }
      catch (err) {
         console.error(err)
         throw new Error('')
      }
      finally {
         popContext()
         popList()
      }
   }
}

export class ListRenderKit {
   renderItem: (item: any, $index: AtomicIon<number>, parent: Element, nodePod: _NodePod) => NodeKit[]
   trace: unknown;

   constructor(
      renderItem: RenderItem<Ionized<any[]>>, //QUESTION: Does this need the context object?
      public data: ListData,
      public getUID: ((item: unknown) => unknown) | undefined,
   ) {
      this.renderItem = wrapWithContext(renderItem, this);
      this.trace = getTrace()
   }

   beforeUpdateTasks: Set<Function> = new Set()
   afterUpdateTasks: Set<Function> = new Set()

   castBeforeUpdate() {
      for (const task of this.beforeUpdateTasks) {
         task()
      }
   }

   castUpdated(toFromIndices: [number, number][]) {
      for (const task of this.afterUpdateTasks) {
         task(toFromIndices)
      }
   }

   private outerNodePod!: _NodePod;
   private dynamicNodePod: _DynamicNodePod | undefined
   indices: AtomicIon<number>[] = [];
   isDynamic: boolean = false;

   _transitions?: Map<AtomicIon<number>, TransitionNode[]>
   get transitions() {
      if (this._transitions) return this._transitions;
      return this._transitions = new Map();
   }

   setUp(
      parent: Element,
      outerNodePod: _NodePod,
   ) {
      const data = this.data
      const getUID = this.getUID
      if (__DEV__) __devCheckIfTracked()


      const _isIonicModel = isIonizedModel(data)
      const isDynamic = this.isDynamic = _isIonicModel || isIon(data);
      this.outerNodePod = outerNodePod;
      const dynamicNodePod = this.dynamicNodePod = isDynamic ? outerNodePod.appendDynamicPod() : undefined;

      // [node, node, [[node, [node, node]], [node, [node]], [node, [node]]], ]

      if (isDynamic) {
         // set up watcher for updates
         // const renderCycle = getCurrentRenderCycle();
         const parentDynamicNode = getActiveDynamicNode()
         const _data = isIon(data) ? getWithoutTracking(data):data // unwrap potentially nested ionized model
         const rawData = isIonizedModel(_data) ? toRaw(_data) as Collection<any> : undefined
         let clone = isIonizedModel(_data) ? shallowClone(rawData!) : undefined //TODO: need to handle cases when ionizedModel is nested in ion
         //TODO: figure out typing for Set, Map, Object vs Array
         
         watch(data as any/* FIX: type error*/, (newValue: any[], oldValue: any[]) => { // typecast as one of the options so that typescript won't complain
            const _oldValue = clone || oldValue;
            if (isIonizedModel(_data)) clone = shallowClone(rawData!) as any[]
            const { indicesToRemove, insertAndMoveKit, noChange } = diff(rawData || newValue, _oldValue, getUID)
            console.log('updating list, noChange', newValue.length, _oldValue.length)
            if (noChange) return;
            if (dynamicNodePod!.length !== _oldValue.length)
               throw new Error(`dynamicPod length ${dynamicNodePod!.length} and data length ${oldValue.length} are mismatched. This should never happen.`)

            this.castBeforeUpdate();
            this.removeItems(indicesToRemove!);
            try {
               this.insertAndMoveItems(insertAndMoveKit!, parent, parentDynamicNode);
            }
            catch (err) {
               console.error(err, this.trace)
            }
         }, { phase: Phase.RENDER })
      }
      // currentItem = undefined;
      $currentIndex = undefined;
      //   popList();
      return this;
   }


   mount(
      parent: Element,
      fragment?: DocumentFragment
   ) {
      const data = this.data
      const list = isIon(data) ? data() : <Collection<any>>data;
      const _list = list instanceof Array ? list : list //TODO: need to implement for sets, maps, and objects
      const listKit = this;
      const isDynamic = this.isDynamic;
      const dynamicNodePod = this.dynamicNodePod;

      for (let i = 0; i < _list.length; i++) {
         const $index = ion(i)
         const item = _list[i]
         $currentIndex = $index;
         this.indices.push($index)

         const nodePod = isDynamic ? dynamicNodePod!.appendNodePod() : this.outerNodePod;

         if (isDynamic) {
            const dynamicNode = makeDynamicNode(nodePod)
            dynamicNode.mount(function mountDynamicItem() {
               console.log('mounting item')
               const nodeEntities = listKit.renderItem(item, $index, parent, nodePod)
               mountNodeEntities(nodeEntities, parent, fragment);
            })
            dynamicNodeMap.set(nodePod, dynamicNode)
         }
         else {
            const nodeEntities = this.renderItem(item, $index, parent, nodePod)
            mountNodeEntities(nodeEntities, parent, fragment);
         }
      }
   }

   private removeItems(indicesToRemove: number[]) {
      // remove from DOM
      for (const index of indicesToRemove) {
         const nodePod = this.dynamicNodePod![index];
         const dynamicNode = dynamicNodeMap.get(nodePod)
         dynamicNode?.destroy()
      }
      //TODO: how do I handle items that have been moved to another port?
   }

   private insertAndMoveItems(
      insertAndMoveKit: InsertAndMoveKit,
      parent: Element,
      parentDynamicNode: DynamicNode
   ) {
      const { getOriginalItem, isNewItem, hasMoved, newUArray, oldUArray, isRemoved } = insertAndMoveKit;
      const dynamicNodePod = this.dynamicNodePod!
      if (dynamicNodePod.length !== oldUArray.length)
         throw new Error("dynamicPod and data length are mismatched")

      const indicesAndNodePods: [number, _NodePod[]][] = []
      const indicesAndFragments: [number, DocumentFragment][] = []
      let fragment = new DocumentFragment();

      const newIndices: AtomicIon<number>[] = [];
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
            const $index = this.indices[prevIndex];
            newIndices.push($index);
            $index.value = i

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
            const $index = ion(i)
            setCurrentIndex($index); // to retreive config
            newIndices.push($index);
            // create and collect consecutive new items onto the same fragment

            pushDynamicNode(parentDynamicNode)
            const dynamicNode = makeDynamicNode(nodePod)
            const renderItem = this.renderItem
            const list = this.data;
            // const _item = (isIonizedModel(list) && item instanceof Object|| isAtomicIon(list) && asMetaIon(list).hasIonicValue) ? ionize(item) : item; //TODO: what about DerivedSignals that output a deep reactive?
            dynamicNode.mount(function renderNewListItem() {
               console.log('rendering new item')
               const nodeEntities = renderItem(toValue(list)[$index()], $index, parent, nodePod);
               mountNodeEntities(nodeEntities, parent, fragment)
            })
            setCurrentIndex(undefined)
            dynamicNodeMap.set(nodePod, dynamicNode)
            popDynamicNode()
         }
         else if (hasMoved(uItem)) {
            // move node to fragment (DOM will auto-remove node from DOM)
            appendNodes(fragment, nodePod);
         }
      }
      this.indices = newIndices;

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
