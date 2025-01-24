import { isIon, isIonizedModel, ion, toRaw, shallowClone, ReactiveGet, isAtomicIon, asMetaIon, watch, Phase, DerivedIon, __devCheckIfTracked, ionize, AtomicIon, toValue, getWithoutTracking } from "@rue/quarky";
import { Collection, ListData, RenderItem } from "./For";
import { popList, pushList } from "./listStack";
import { normalizeToArray } from "@rue/utils";
import { mountNodeEntities } from "../node/mountNodeEntity";
import { DynamicNode, getDynamicNode } from "../dynamic/DynamicNode";
import { diff, InsertAndMoveKit } from "./diff";
import { Context, getCommons, popCommons, pushCommons } from "../context/context-stack";
import { NodeKit, setUpNodeEntities } from "../node/setUpNodeEntities";
import { TransitionNode } from "../transition/TransitionNode";
import { createCommons } from "../context/Commons";
import { useTransitionNodes } from "../transition/TransitNode";
import { getTrace } from "../watch/debug";
import { NodePod } from "../node/NodePod";
import { mountConditional } from "../conditional/ConditionalRenderSeries";
import { getActiveFlask } from "@rue/flask";


type Index = number
type Count = number

type DynamicList<T = any> = Collection<T> | ReactiveGet<Collection<T>>

const dynamicNodeMap: WeakMap<NodePod, DynamicNode> = new WeakMap()

// let currentItem: any;
let $currentIndex: AtomicIon<number> | undefined;

export function getCurrentIndex(): AtomicIon<number> | undefined {
   return $currentIndex
}

export function setCurrentIndex($index: AtomicIon<number> | undefined) {
   // currentItem = item;
   $currentIndex = $index;
}

function wrapWithContext(renderItem: RenderItem<any[]>, list: ListRenderKit) {
   return (item: any, $index: AtomicIon<number>, parent: Element, nodePod: NodePod, initialRender: boolean = false) => {
      const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()
      list.transitions.set($index, transitionNodes)
      try {
         if (!initialRender) {
            pushList(list) //QUESTION: dunno if pushList needs to be in this conditional block
            pushCommons(list.context)
         }
         const nodeEntities = setUpNodeEntities(normalizeToArray(
            createCommons(() => renderItem(item, $index), {
               provide: { [REGISTER_TRANSITION_NODE]: registerTransitionNode }
            })
         ), parent, nodePod)
         return nodeEntities;
      }
      finally {
         if (!initialRender) {
            popCommons()
            popList()
         }
      }
   }
}

export class ListRenderKit {
   renderItem: (item: any, $index: AtomicIon<number>, parent: Element, nodePod: NodePod, initialRender: boolean) => NodeKit[]
   trace: unknown;

   constructor(
      renderItem: RenderItem<any[]>, //QUESTION: Does this need the context object?
      public data: ListData,
      public getUID: ((item: unknown) => unknown) | undefined,
      public context: Context
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

   private outerNodePod!: NodePod;
   private dynamicNodePod: NodePod | undefined
   indices: AtomicIon<number>[] = [];
   isDynamic: boolean = false;

   _transitions?: Map<AtomicIon<number>, TransitionNode[]>
   get transitions() {
      if (this._transitions) return this._transitions;
      return this._transitions = new Map();
   }

   parentDynamicNode!: DynamicNode

   setUp(
      parent: Element,
      outerNodePod: NodePod,
   ) {
      const data = this.data
      const getUID = this.getUID
      if (__DEV__) __devCheckIfTracked()


      const _isIonicModel = isIonizedModel(data)
      const isDynamic = this.isDynamic = _isIonicModel || isIon(data);
      this.outerNodePod = outerNodePod;
      const dynamicNodePod = this.dynamicNodePod = isDynamic ? outerNodePod.appendNodePod() : undefined;

      // [node, node, [[node, [node, node]], [node, [node]], [node, [node]]], ]

      if (isDynamic) {
         // set up watcher for updates
         // const renderCycle = getCurrentRenderCycle();
         const parentDynamicNode = this.parentDynamicNode = getDynamicNode()
         const _data = isIon(data) ? getWithoutTracking(data) : data // unwrap potentially nested ionized model
         const rawData = isIonizedModel(_data) ? toRaw(_data) as Collection<any> : undefined
         let clone = isIonizedModel(_data) ? shallowClone(rawData!) : undefined //TODO: need to handle cases when ionizedModel is nested in ion
         //TODO: figure out typing for Set, Map, Object vs Array

         watch(data as any/* FIX: type error*/, ({newState, oldState}) => { // typecast as one of the options so that typescript won't complain
            const _oldValue = clone || oldState;
            if (isIonizedModel(_data)) clone = shallowClone(rawData!) as any[]
            const { indicesToRemove, insertAndMoveKit, noChange } = diff(rawData || newState, _oldValue, getUID)
            if (noChange) return;
            if (dynamicNodePod!.length !== _oldValue.length)
               throw new Error(`dynamicPod length ${dynamicNodePod!.length} and data length ${oldState.length} are mismatched. This should never happen.`)

            this.castBeforeUpdate();
            this.removeItems(indicesToRemove!);
            try {
               this.insertAndMoveItems(insertAndMoveKit!, parent, parentDynamicNode);
            }
            catch (err) {
               console.error(err, this.trace)
            }
            console.log('updating list', newState.length, _oldValue.length)
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
      const data = toValue(this.data);
      const list = data instanceof Array ? data : data //TODO: need to implement for sets, maps, and objects
      const listKit = this;
      const isDynamic = this.isDynamic;
      const dynamicNodePod = this.dynamicNodePod!;

      for (let i = 0; i < list.length; i++) {
         const $index = ion(i)
         const item = list[i]
         $currentIndex = $index;
         this.indices.push($index)

         const nodePod = isDynamic ? dynamicNodePod.appendNodePod() : this.outerNodePod;

         if (isDynamic) {
            const dynamicNode = getDynamicNode().fork()
            dynamicNode.mount(function mountDynamicItem() {
               const nodeEntities = listKit.renderItem(item, $index, parent, nodePod, true)
               mountNodeEntities(nodeEntities, parent, fragment);
            })
            dynamicNodeMap.set(nodePod, dynamicNode)
         }
         else {
            const nodeEntities = this.renderItem(item, $index, parent, nodePod, true)
            mountNodeEntities(nodeEntities, parent, fragment);
         }
      }
   }

   private removeItems(indicesToRemove: number[]) {
      // remove from DOM
      for (const index of indicesToRemove) {
         const nodePod = this.dynamicNodePod![index] as NodePod;
         const dynamicNode = dynamicNodeMap.get(nodePod)
         dynamicNode?.discard()
         nodePod.forEachNode(node =>
            node.remove()
         )
      }
      //TODO: how do I handle items that have been moved to another port?
   }

   private insertAndMoveItems(
      insertAndMoveKit: InsertAndMoveKit,
      parent: Element,
      parentDynamicNode: DynamicNode
   ) {
      const { isNewItem, hasMoved, newUArray, oldUArray, isRemoved } = insertAndMoveKit;
      const dynamicNodePod = this.dynamicNodePod!
      if (dynamicNodePod.length !== oldUArray.length)
         throw new Error("dynamicPod and data length are mismatched")
      
      const indicesAndNodePods: [number, NodePod[]][] = []
      const indicesAndFragments: [number, DocumentFragment][] = []
      let fragment = new DocumentFragment();
      
      const newIndices: AtomicIon<number>[] = [];
      const toFromIndices: [number, number][] = []
      
      for (let i = 0; i < newUArray.length; i++) {
         const uItem = newUArray[i];
         const _isNewItem = isNewItem(uItem);
         const itemHasMoved = hasMoved(uItem);
         const oldIndex = oldUArray.indexOf(uItem)
         const nodePod = _isNewItem ? new NodePod()
         : itemHasMoved ? (dynamicNodePod[oldIndex] as unknown as NodePod) // dynamicNodePod[index]
         : null;
         
         if (!_isNewItem) {
            // update $index.state
            const $index = this.indices[oldIndex];
            newIndices.push($index);
            $index.state = i

            // to update refs
            toFromIndices.push([i, oldIndex]);
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
            // const item = getOriginalItem(uItem, newUArray)
            const $index = ion(i)
            setCurrentIndex($index); // to retreive config
            newIndices.push($index);
            // create and collect consecutive new items onto the same fragment
            const dynamicNode = parentDynamicNode.fork()
            const renderItem = this.renderItem
            const list = this.data;
            // const _item = (isIonizedModel(list) && item instanceof Object|| isAtomicIon(list) && asMetaIon(list).hasIonicValue) ? ionize(item) : item; //TODO: what about DerivedSignals that output a deep reactive?
            dynamicNode.mount(function renderNewListItem() {
               const nodeEntities = renderItem(toValue(list)[i], $index, parent, nodePod, false);
               // mountConditional(parent, nodePod, nodeEntities, fragment)
               mountNodeEntities(nodeEntities, parent, fragment)
            })
            setCurrentIndex(undefined)
            dynamicNodeMap.set(nodePod, dynamicNode)
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
         const prevNode = (<NodePod>dynamicNodePod[index]).prevNode
         if (prevNode && prevNode === parent) parent.append(fragment) // for teleport
         else if (prevNode) prevNode.after(fragment);
         else parent.prepend(fragment);
      }

      this.castUpdated(toFromIndices)
   }
}







// function removeNodesFromRef(nodePod: NodePod) {
//     nodePod.forEachNode((node, index) => {
//         const ref = getNodeArrayRef(node)
//         if (ref) ref.removeNode(index!) //TODO: This
//     })
// }



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
