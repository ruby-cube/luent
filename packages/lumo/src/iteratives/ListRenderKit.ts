import { isIon, isIonizedModel, ion, toRaw, shallowClone, watch, __DEV__checkIfTracked, toValue, Ion, toIon, queueTask, MutableIon } from "@rue/quarky";
import { Collection, ListData, RenderItem } from "./For";
import { popList, pushList } from "./listStack";
import { normalizeToArray } from "@rue/utils";
import { mountNodeEntities } from "../node/mountNodeKits";
import { diff, InsertAndMoveKit } from "./diff";
import { Commons } from "../commons/commons-stack";
import { NodeEntity, setUpNodeEntities } from "../node/setUpNodeEntities";
import { TransitionNode } from "../transition/TransitionNode";
import { Commons as createCommons } from "../commons/Commons";
import { useTransitionNodes } from "../transition/TransitNode";
import { DynamicPod, mountDOMNodes, NodePod, removeDOMNodes } from "../node/NodePod";
import { FLASK, Flask, getFlask } from "@rue/flask";
import { $_run_with_, $_snap_context } from "../../../flask/context/AsyncContext";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { recordMutations } from "../../../quarky/src/Mutable";
import { AnyObject } from "@rue/types";
import { queueInternalRender, PRERENDER, watchToRender } from "../render-cycle";
import { Compound, detachedCall, popTracker, pushTracker } from "../../../quarky/src/compound/Compound";
import { quarkOf } from "../../../quarky/src/Quark";


type Index = number
type Count = number

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
   // const data = toIon(list.data);

   // const $i = ion(() => data()?.indexOf(toRaw(item)))
   try {
      pushList(list)
      const nodeEntities = setUpNodeEntities(normalizeToArray(
         createCommons({
            Slot: () => renderItem(item, $index),
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
      const listContext = $_snap_context()
      this.outerFlask = getFlask()
      this.renderItem = (item: any, $index: Ion<number>, parent: Element, nodePod: NodePod, fragment?: DocumentFragment, flask?: Flask) => {
         const context = { ...listContext }
         if (flask) context[FLASK] = flask
         if (__DEV__) context[TRACE] = this.__DEV__asyncPath!
         $_run_with_(context, () => {
            const nodeEntities = callWithCommons(renderItem, this, item, $index, parent, nodePod)
            // queueInternalRender(() => {
               mountNodeEntities(nodeEntities, parent, fragment);
            // }, this.outerFlask)
         })
      }

      if (__DEV__) this.__DEV__asyncPath = __DEV__buildAsyncPath()
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

   dynamicPod: DynamicPod = new NodePod()
   indices: MutableIon<number>[] = [];

   _transitions?: Map<Ion<number>, TransitionNode[]>
   get transitions() {
      if (this._transitions) return this._transitions;
      return this._transitions = new Map();
   }

   outerFlask!: Flask

   setUp(
      parent: Element,
   ) {
      const data = this.data
      const getUID = this.getUID
      if (__DEV__) __DEV__checkIfTracked()

      // [node, node, [[node, [node, node]], [node, [node]], [node, [node]]], ]

      // set up watcher for updates
      // const effectCycle = getCurrentEffectCylce();
      const _data = isIon(data) ? detachedCall(data) : data // unwrap potentially nested ionized model
      let clone = createClone(data, _data)
      // let clone = isIon(data) && isIonizedModel(_data) ? shallowClone(toRaw(_data)) : undefined
      //TODO: figure out typing for Set, Map, Object vs Array
      let recording = isIonizedModel(_data) ? recordMutations(_data) : undefined


      function createClone(subject: AnyObject, state: AnyObject) {
         return isIonizedModel(state) ? shallowClone(quarkOf(state).state.current) : undefined
         // return isIon(subject) && isIonizedModel(state) ? shallowClone(toRaw(state)) : undefined
      }

      function hasChanged(oldState: AnyObject, state: AnyObject) {

      }

      const dynamicPod = this.dynamicPod
      const $list = this.$list

      watchToRender(this.$list, ({ previous }) => { // typecast as one of the options so that typescript won't complain
         // if (recording && state === previous){
         //    recording.stop()
         //    console.log('updating list via MUTATIONS')
         //    //TODO: this.applyMutations(recording.mutations)
         //    recording = recordMutations(_data)
         //    return;
         // }
         const current = $list()
         console.log('updating list?')
         const _prevState = clone ?? toRaw(previous)
         console.log('_prevState', _prevState, previous)
         clone = createClone(data, current)
         // clone = isIon(data) && isIonizedModel(state) ? shallowClone(_state) as any[] : undefined
         const { indicesToRemove, insertAndMoveKit, noChange } = diff(isIonizedModel(current) ? quarkOf(current).state.current : current, _prevState, getUID)
         if (noChange) { //TODO: should we use hasChanged function in watch options instead?
            console.log('no list change', current, _prevState)
            return;
         }
         if (dynamicPod!.length !== _prevState.length)
            throw new Error(`dynamicPod length ${dynamicPod!.length} and data length ${previous.length} are mismatched. This should never happen.`)
         this.castBeforeUpdate();
         this.removeItems(indicesToRemove!);
         try {
            this.insertAndMoveItems(insertAndMoveKit!, parent);
         }
         catch (err) {
            console.error(err, this.__DEV__asyncPath)
         }
      }, this.outerFlask)
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
      const dynamicPod = this.dynamicPod!;

      for (let i = 0; i < list.length; i++) {
         const item = list[i]
         const $index = ion(i)
         setCurrentIndex($index)
         this.indices.push($index)

         const nodePod = new NodePod()
         dynamicPod.push(nodePod)

         const flask = this.outerFlask.spawn({ type: 'view', creationScope: true })
         listKit.renderItem(item, $index, parent, nodePod, fragment, flask)
         queueInternalRender(() =>
            flask.emitInitialMount()
            , this.outerFlask)
         flaskMap.set(nodePod, flask)
      }
   }

   private removeItems(indicesToRemove: number[]) {
      // remove from DOM
      for (const index of indicesToRemove) {
         const nodePod = this.dynamicPod[index] as NodePod;
         const flask = flaskMap.get(nodePod)
         flask?.emitDiscard()
         queueInternalRender(() => {
            removeDOMNodes(nodePod)
         }, this.outerFlask)
      }
      //TODO: how do I handle items that have been moved to another port?
   }

   private async insertAndMoveItems(
      insertAndMoveKit: InsertAndMoveKit,
      parent: Element,
   ) {
      const { isNewItem, hasMoved, isRemoved, getOldIndex, newArray, oldArray } = insertAndMoveKit;
      const dynamicPod = this.dynamicPod!
      if (dynamicPod.length !== oldArray.length)
         throw new Error("dynamicPod and data length are mismatched")

      const indicesAndNodePods: [number, NodePod[]][] = []
      const indicesAndFragments: [number, DocumentFragment][] = []
      let fragment = new DocumentFragment();

      const newIndices: MutableIon<number>[] = [];
      const toFromIndices: [number, number][] = []

      for (let i = 0; i < newArray.length; i++) {
         const item = newArray[i];
         const _isNewItem = isNewItem(item);
         const itemHasMoved = hasMoved(item);
         const oldIndex = getOldIndex(item)

         const nodePod = _isNewItem ? new NodePod()
            : itemHasMoved ? (dynamicPod[oldIndex] as unknown as NodePod) // dynamicNodePod[index]
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

         if (isNewItem(item)) {
            const $index = ion(i) //TODO: this should be 
            newIndices.push($index) 

            setCurrentIndex($index); // to retreive config

            const flask = this.outerFlask.spawn({ type: 'view', creationScope: true })
            this.renderItem(item, $index, parent, nodePod, fragment, flask)
            queueInternalRender(() =>
               flask.emitInitialMount()
               , this.outerFlask)
            setCurrentIndex(undefined)
            flaskMap.set(nodePod, flask) // store for removal
         }
         else if (hasMoved(item)) {
            // move node to fragment (DOM will auto-remove node from DOM)
            const frag = fragment; // must pass reference since fragment is reassigned across the loop
            queueInternalRender(() => {
               transferNodes(frag, nodePod);
            }, this.outerFlask)
         }
      }
      this.indices = newIndices;

      // queue nodePod removal
      const indicesAndRemoveCount: [Index, Count][] = [];
      let j = 0;
      while (j < oldArray.length) {
         const item = oldArray[j];
         if (isRemoved(item) || hasMoved(item)) {
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
         dynamicPod.remove(index, count);
      }

      // (2) insert node pods into dynamic list
      for (const [index, nodePods] of indicesAndNodePods) {
         dynamicPod.insert(index, nodePods)
      }

      // (3) insert nodes into DOM
      queueInternalRender(() => {
         for (const [index, fragment] of indicesAndFragments) {
            mountDOMNodes(dynamicPod[index] as NodePod, parent, fragment)
         }
         this.castUpdated(toFromIndices)
      }, this.outerFlask)
   }
}






// function removeNodesFromRef(nodePod: NodePod) {
//     nodePod.forEachNode((node, index) => {
//         const ref = getNodeArrayRef(node)
//         if (ref) ref.removeNode(index!) //TODO: This
//     })
// }


/**
 * mount nodes to fragment but not to DOM yet
 * @param fragment
 * @param nodePod 
 */
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
