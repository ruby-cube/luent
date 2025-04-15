import { isIon, isIonizedModel, ion, toRaw, shallowClone, watch, __devCheckIfTracked, ionize, AtomicIon, toValue, untrackedCall, Ion, detachedCall, toIon } from "@rue/quarky";
import { Collection, ListData, RenderItem } from "./For";
import { popList, pushList } from "./listStack";
import { normalizeToArray } from "@rue/utils";
import { mountNodeEntities } from "../node/mountNodeKits";
import { getViewFlask } from "../flask/ViewFlask";
import { diff, InsertAndMoveKit } from "./diff";
import { Commons } from "../commons/commons-stack";
import { NodeKit, setUpNodeEntities } from "../node/setUpNodeEntities";
import { TransitionNode } from "../transition/TransitionNode";
import { createCommons } from "../commons/Commons";
import { useTransitionNodes } from "../transition/TransitNode";
import { NodePod } from "../node/NodePod";
import { mountConditional, mountDOMNodes, removeDOMNodes } from "../conditional/ConditionalRenderSeries";
import { FLASK, Flask } from "@rue/flask";
import { $_run_with_, $_snap_context } from "../../../flask/context/AsyncContext";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { POSTEVENT, RENDER } from "../render-cycle";
import { recordMutations } from "../../../quarky/src/Mutable";
import { AnyObject } from "@rue/types";


type Index = number
type Count = number

type DynamicList<T = any> = Collection<T> | ReactiveGet<Collection<T>>

const flaskMap: WeakMap<NodePod, Flask> = new WeakMap()

// let currentItem: any;
let $currentIndex: Ion<number> | undefined;

export function getCurrentIndex(): Ion<number> | undefined {
   return $currentIndex
}

export function setCurrentIndex($index: Ion<number> | undefined) {
   // currentItem = item;
   $currentIndex = $index;
}

function callWithCommons(renderItem: RenderItem<any[]>, list: ListRenderKit, item: any, $index: Ion<number>, parent: Element, nodePod: NodePod) {
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes() // QUESTION: Should this be outside of the render function??
   list.transitions.set($index, transitionNodes)
   try {
      pushList(list)
      const nodeEntities = setUpNodeEntities(normalizeToArray(
         createCommons(() => renderItem(item, $index), {
            provide: [REGISTER_TRANSITION_NODE(registerTransitionNode)]
         })
      ), parent, nodePod)
      return nodeEntities;
   }
   finally {
      popList()
   }
}

export class ListRenderKit {
   renderItem: (item: any, $index: Ion<number>, parent: Element, nodePod: NodePod, fragment?: DocumentFragment, flask?: Flask) => void
   __DEV__asyncPath?: string;

   $list: Ion<any[]>

   constructor(
      renderItem: RenderItem<any[]>, //QUESTION: Does this need the context object?
      public data: ListData,
      public getUID: ((item: unknown) => unknown) | undefined,
      public commons: Commons
   ) {
      this.$list = toIon(data) as unknown as Ion<Array<any>>
      const context = $_snap_context()
      this.renderItem = (item: any, $index: Ion<number>, parent: Element, nodePod: NodePod, fragment?: DocumentFragment, flask?: Flask) => {
         if (flask) context.set(FLASK, flask)
         if (__DEV__) context.set(TRACE, this.__DEV__asyncPath!)
         $_run_with_(context, () => {
            const nodeEntities = callWithCommons(renderItem, this, item, $index, parent, nodePod)
            mountNodeEntities(nodeEntities, parent, fragment);
         })
      }

      if (__DEV__) this.__DEV__asyncPath = __DEV__buildAsyncPath()
      this.outerFlask = getViewFlask()
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
   indices: Ion<number>[] = [];
   isDynamic: boolean = false;

   _transitions?: Map<Ion<number>, TransitionNode[]>
   get transitions() {
      if (this._transitions) return this._transitions;
      return this._transitions = new Map();
   }

   outerFlask!: Flask

   setUp(
      parent: Element,
      outerNodePod: NodePod,
   ) {
      const data = this.data
      const getUID = this.getUID
      if (__DEV__) __devCheckIfTracked()


      const _isIonizedModel = isIonizedModel(data)
      const isDynamic = this.isDynamic = _isIonizedModel || isIon(data);
      this.outerNodePod = outerNodePod;
      const dynamicNodePod = this.dynamicNodePod = isDynamic ? outerNodePod.appendNodePod() : undefined;

      // [node, node, [[node, [node, node]], [node, [node]], [node, [node]]], ]

      if (isDynamic) {
         // set up watcher for updates
         // const effectCycle = getCurrentEffectCylce();
         const _data = isIon(data) ? detachedCall(data) : data // unwrap potentially nested ionized model
         let clone = createClone(data, _data)
         // let clone = isIon(data) && isIonizedModel(_data) ? shallowClone(toRaw(_data)) : undefined
         //TODO: figure out typing for Set, Map, Object vs Array
         let recording = isIonizedModel(_data) ? recordMutations(_data) : undefined


         function createClone(subject: AnyObject, state: AnyObject) {
            return isIonizedModel(state) ? shallowClone(toRaw(state)) : undefined
            // return isIon(subject) && isIonizedModel(state) ? shallowClone(toRaw(state)) : undefined
         }

         function hasChanged(oldState: AnyObject, state: AnyObject) {

         }

         watch(data, ({ state, prevState }) => { // typecast as one of the options so that typescript won't complain
            // if (recording && state === prevState){
            //    recording.stop()
            //    console.log('updating list via MUTATIONS')
            //    //TODO: this.applyMutations(recording.mutations)
            //    recording = recordMutations(_data)
            //    return;
            // }
            const _prevState = clone ?? toRaw(prevState)
            clone = createClone(data, state)
            // clone = isIon(data) && isIonizedModel(state) ? shallowClone(_state) as any[] : undefined
            const { indicesToRemove, insertAndMoveKit, noChange } = diff(toRaw(state), _prevState, getUID)
            if (noChange) { //TODO: should we use hasChanged function in watch options instead?
               return;
            }
            if (dynamicNodePod!.length !== _prevState.length)
               throw new Error(`dynamicPod length ${dynamicNodePod!.length} and data length ${prevState.length} are mismatched. This should never happen.`)

            this.castBeforeUpdate();
            this.removeItems(indicesToRemove!);
            try {
               this.insertAndMoveItems(insertAndMoveKit!, parent);
            }
            catch (err) {
               console.error(err, this.__DEV__asyncPath)
            }
            // console.log('updating list', state.length, _oldValue.length)
         }, { phase: POSTEVENT })
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

      const list = data instanceof Array ? data : data as unknown as Array<any> //TODO: need to implement for sets, maps, and objects
      const listKit = this;
      const isDynamic = this.isDynamic;
      const dynamicNodePod = this.dynamicNodePod!;
      const $list = this.$list;

      for (let i = 0; i < list.length; i++) {
         const item = list[i]
         const $index = ion(() => $list().indexOf(item)) //TODO: this should be 
         $currentIndex = $index;
         this.indices.push($index)

         const nodePod = isDynamic ? dynamicNodePod.appendNodePod() : this.outerNodePod;

         if (isDynamic) {
            const flask = this.outerFlask.spawn({ type: 'view', creationScope: true })
            listKit.renderItem(item, $index, parent, nodePod, fragment, flask)
            flask.emitInitialMount()
            flaskMap.set(nodePod, flask)
         }
         else {
            listKit.renderItem(item, $index, parent, nodePod, fragment)
         }
      }
   }

   private removeItems(indicesToRemove: number[]) {
      // remove from DOM
      for (const index of indicesToRemove) {
         const nodePod = this.dynamicNodePod![index] as NodePod;
         const flask = flaskMap.get(nodePod)
         flask?.emitDiscard()
         removeDOMNodes(nodePod)
      }
      //TODO: how do I handle items that have been moved to another port?
   }

   private insertAndMoveItems(
      insertAndMoveKit: InsertAndMoveKit,
      parent: Element,
   ) {
      const { isNewItem, hasMoved, newUArray, oldUArray, isRemoved } = insertAndMoveKit;
      const dynamicNodePod = this.dynamicNodePod!
      if (dynamicNodePod.length !== oldUArray.length)
         throw new Error("dynamicPod and data length are mismatched")

      const indicesAndNodePods: [number, NodePod[]][] = []
      const indicesAndFragments: [number, DocumentFragment][] = []
      let fragment = new DocumentFragment();

      const newIndices: Ion<number>[] = [];
      const toFromIndices: [number, number][] = []

      for (let i = 0; i < newUArray.length; i++) {
         const uItem = newUArray[i];
         const _isNewItem = isNewItem(uItem);
         const itemHasMoved = hasMoved(uItem);
         const oldIndex = oldUArray.indexOf(uItem)
         console.log('item has moved', oldIndex, i, itemHasMoved)
         const nodePod = _isNewItem ? new NodePod()
            : itemHasMoved ? (dynamicNodePod[oldIndex] as unknown as NodePod) // dynamicNodePod[index]
               : null;

         if (!_isNewItem) {
            const $index = this.indices[oldIndex];
            newIndices.push($index);

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
            const $list = this.$list
            const item = toValue(this.data)[i]
            const $index = ion(() => $list().indexOf(item)) //TODO: this should be 

            setCurrentIndex($index); // to retreive config
            newIndices.push($index);
            // create and collect consecutive new items onto the same fragment
            const flask = this.outerFlask.spawn({ type: 'view', creationScope: true })
            // const _item = (isIonizedModel(list) && item instanceof Object|| isAtomicIon(list) && asMetaIon(list).stateIsIonized) ? ionize(item) : item; //TODO: what about DerivedSignals that output a deep reactive?
            this.renderItem(item, $index, parent, nodePod, fragment, flask)
            flask.emitInitialMount()
            setCurrentIndex(undefined)
            flaskMap.set(nodePod, flask)
         }
         else if (hasMoved(uItem)) {
            // move node to fragment (DOM will auto-remove node from DOM)
            transferNodes(fragment, nodePod);
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
         mountDOMNodes(<NodePod>dynamicNodePod[index], parent, fragment)
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



function transferNodes(fragment: DocumentFragment, nodePod: NodePod) {
   for (const nodeOrPod of nodePod) {
      if (nodeOrPod instanceof Node) {
         fragment.appendChild(nodeOrPod)
      }
      else {
         for (const nodePod of nodeOrPod) {
            transferNodes(fragment, nodePod as NodePod)
         }
      }
   }
}
