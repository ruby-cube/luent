import { makeDynamicNode } from "../dynamic/makeDynamicNode";
import { DynamicNode, NULLISH_DYNAMIC_NODE } from "../dynamic/DynamicNode";
import { NodeEntity, SwapType } from "../node/makeNode";
import { mountNodeEntities } from "../node/mountNodeEntity";
import { _DynamicNodePod, _NodePod, NodePod, NULLISH_NODE_POD } from "../node/NodePod";
import { ConditionalRenderKit } from "./ConditionalRenderKit";
import { ConditionalSeries } from "./ConditionalSeries";
import { hidePrevConditionalNodes, showConditionalNodes } from "./toggledisplay";
import { watch } from "../watch/watchAndPreserve";
import { areShallowEqualArrays, Phase } from "../../../quarky/src";
import { getActiveDynamicNode, popDynamicNode, pushDynamicNode } from "../dynamic/nodestack";
import { popContext, pushContext, Context } from "../context/context-stack";
import { getPhasicNode, PhasicNode } from "../transition/PhasicNode";
import { TransitionNode } from "../transition/TransitionNode";
import { NodeKit } from "../node/setUpNodeEntities";



export class ConditionalRenderSeries extends ConditionalSeries {
   declare statements: ConditionalRenderKit[];

   private dynamicNodes: DynamicNode[] = []
   private storeDynamicNode(dynamicNode: DynamicNode, index: number) {
      // if (__DEV__ && this.dynamicNodes[index] !== NULLISH_DYNAMIC_NODE && this.dynamicNodes[index] !== undefined)
      // throw new Error('Dynamic Node already exists at this index')
      this.dynamicNodes[index] = dynamicNode;
   }

   private _dynamicNodePod!: _DynamicNodePod;

   private initDynamicNodePod(dynamicNodePod: _DynamicNodePod) {
      if (this._dynamicNodePod) {
         if (__DEV__) throw new Error('dynamicNodePod can only be initialized once')
         return;
      }
      this._dynamicNodePod = dynamicNodePod;

      // populate dynamic node pod
      // 'show' node pods are aggregated to the front of the dynamicNodePod
      // 'create' and 'mount' node pods share the last node pod of dynamicNodePod
      // This way, we can mount 'create' and 'mount' efficiently without having 
      // to traverse empty 'create' and 'mount' node pods when looking for previous sibling
      let hasCreateOrMount = false;
      for (const kit of this.statements) {
         if (kit.type === 'show')
            dynamicNodePod.appendNodePod()
         else
            hasCreateOrMount = true;
      }

      if (hasCreateOrMount) {
         dynamicNodePod.appendNodePod()
      }
   }

   private get dynamicNodePod() {
      if (__DEV__ && !this._dynamicNodePod)
         throw new Error('Dynamic Node Pod has not been initialized')
      return this._dynamicNodePod;
   }

   private getNodePod(index: number) {
      const nodePodIndex = this.toNodePodIndex(index)
      console.log('getNodePod', index, this.dynamicNodePod[nodePodIndex])
      return this.dynamicNodePod[nodePodIndex]
   }

   private setNodePod(index: number, nodePod: _NodePod) {
      console.log('index', index)
      const nodePodIndex = this.toNodePodIndex(index)
      console.log('nodePodIndex', nodePodIndex)
      this.dynamicNodePod.setNodePod(nodePodIndex, nodePod)
   }

   private toNodePodIndex(index: number) {
      const kit = this.statements[index]
      const nodePodIndex = kit.nodePodIndex;
      if (nodePodIndex === undefined)
         return this.dynamicNodePod.length - 1
      return nodePodIndex;
   }

   context: Context

   phasicNode?: TransitionNode

   constructor(
      statements: ConditionalRenderKit[],
      // public type: 'create' | 'show' | 'mount',
      makeElseKit: () => ConditionalRenderKit,
      public swap: SwapType = 'instance'
   ) {
      super(statements, makeElseKit);
      const context = this.context = statements[0].context;
      this.phasicNode =       getPhasicNode(context);
      // statements[0].optionals?.phasicNode
   }

   mount( // the initial mount after setup
      parent: Element,
      fragment?: DocumentFragment
   ) {
      // evaluate conditions and render
      const activeIndex = this.evaluateConditions()

      const series = this;

      const _nodePod = this.getNodePod(activeIndex)

      const dynamicNode = makeDynamicNode(_nodePod)
      dynamicNode.mount(function renderConditional() {
         const nodeEntities = series.render(activeIndex, parent)
         console.log('initial mount of conditional')
         mountConditional(parent, series.dynamicNodePod, nodeEntities, fragment);
      })
      this.storeDynamicNode(dynamicNode, activeIndex)
   }

   setUp(
      parent: Element,
      outerNodePod: _NodePod,
   ) {
      //TODO: static conditional
      const parentDynamicNode = getActiveDynamicNode()
      const dynamicPod = outerNodePod.appendDynamicPod();
      this.initDynamicNodePod(dynamicPod)
      const $conditions = this.getConditionsIon()
      const phasicNode = this.phasicNode
      const series = this;

      console.log('setting conditional', $conditions)
      let entranceStateTime = 0;
      let exitStateTime = 0;
      let outgoingIndex: number | undefined;
      let newTransitionIn: (() => void) | undefined;
      let prevOutgoingNodes: TransitionNode[];
      let prevIncomingNodes: TransitionNode[];

      // set up watcher for updates
      watch($conditions, function updateConditional(newValue, oldValue) {
         console.log("update conditional==================", newValue, oldValue)
         if (areShallowEqualArrays(newValue, oldValue)) return;

         const prevIndex = series.activeIndex!;
         const activeIndex = series.evaluateConditions();
         if (prevIndex === activeIndex) {
            return;
         }

         const outgoingNodes = series.statements[prevIndex].transitionNodes
         const incomingNodes = series.statements[activeIndex].transitionNodes
         const activationType = series.statements[activeIndex].type || toActivationType(series.swap); //TODO: make this a prop of series not the statement
         const shouldTransitionOut = phasicNode || outgoingNodes.length

         // (0) Pause previous transition
         if (entranceStateTime) {
            if (phasicNode) {
               phasicNode.cancel('in');
               phasicNode.pause('in', entranceStateTime);
            }
            for (const node of prevIncomingNodes) {
               node.cancel('in')
               node.pause('in', entranceStateTime)
            }
            entranceStateTime = 0;
            prevIncomingNodes = [...incomingNodes];
            prevOutgoingNodes = [...outgoingNodes]
         } else if (exitStateTime) {
            if (activeIndex === outgoingIndex) {
               if (phasicNode) {
                  phasicNode.cancel('out');
                  phasicNode.pause('out', entranceStateTime);
               }
               for (const node of prevOutgoingNodes) {
                  node.cancel('out')
                  node.pause('out', entranceStateTime)
               }
               exitStateTime = 0;
               outgoingIndex = undefined;

               // (4)
               // transition in right away (since it doesn't need to be activated since it was never removed)
               if (phasicNode || incomingNodes.length)
                  transitionConditionalIn()

               prevIncomingNodes = [...incomingNodes];
               prevOutgoingNodes = [];
            }
            else {
               newTransitionIn = () => {
                  //TODO: Morph?
                  // (3)
                  activateConditional() //TODO: this shouldn't happen until after transitionend

                  // (4)
                  if (phasicNode || incomingNodes.length)
                     transitionConditionalIn()
               }
               prevIncomingNodes = [...incomingNodes]
            }
            return;
         }
         else {
            prevIncomingNodes = [...incomingNodes]
            prevOutgoingNodes = [...outgoingNodes]
         }


         if (!shouldTransitionOut) {
            try {
               series.deactivateConditional(prevIndex)
            }
            catch (err) {
               if (__DEV__) console.error(err)
               return; // if deactivate fails, we don't activate the new conditional
            }

            // (3)
            activateConditional()

            // (4)
            if (phasicNode || incomingNodes.length) {
               transitionConditionalIn()
            }
         }
         else { // (1) Transition out
            exitStateTime = new Date().getTime();
            outgoingIndex = prevIndex;
            const cleanups: (() => void)[] = []

            let nodeCount = outgoingNodes.length + (phasicNode ? 1 : 0)

            if (phasicNode) {
               phasicNode.transitionOut(afterTransitionOut)
            }

            for (const node of outgoingNodes) {
               node.transitionOut(afterTransitionOut);
            }


            function afterTransitionOut(cleanup?: () => void) {
               nodeCount--;
               if (cleanup) cleanups.push(cleanup)

               if (phasicNode || nodeCount === 0) {
                  for (const node of outgoingNodes) {
                     if (node.animatingOut || node.transitioningOut) {
                        node.cancel('out')
                     }
                  }
                  exitStateTime = 0;

                  for (const cleanup of cleanups) {
                     cleanup()
                  }
                  // const initialPosition = phasicNode?.getDimsAndPosition();
                  series.deactivateConditional(prevIndex)

                  if (!newTransitionIn) {
           
                     // (3)
                     activateConditional()
                     // const finalPosition = phasicNode?.getDimsAndPosition();

                     // (4)
                     if (phasicNode || incomingNodes.length) {
                        transitionConditionalIn()
                        // transitionConditionalIn(initialPosition, finalPosition)
                     }
                  }
                  else {
                     newTransitionIn();
                     newTransitionIn = undefined;
                  }

                  if (activationType === 'create')
                     outgoingNodes.length = 0; // clear array for next transition nodes
               }
            }
         }

         function activateConditional() {
            if (activationType === 'create') incomingNodes.length = 0; // clear array for next transition nodes
            pushDynamicNode(parentDynamicNode!)
            console.log('MOUNT:', activeIndex)
            series.activateConditional(activeIndex, parent)
            popDynamicNode()
         }

         function transitionConditionalIn(initialPosition?: DOMRect, finalPosition?: DOMRect) {
            let nodeCount = incomingNodes.length + (phasicNode ? 1 : 0)
            // console.log('nodeCount', incomingNodes.length)
            entranceStateTime = new Date().getTime()
            for (const node of incomingNodes) {
               node.transitionIn(endTransition);
            }
            if (phasicNode) {
               if (initialPosition && finalPosition) 
                  phasicNode.morph(initialPosition, finalPosition)
               phasicNode.transitionIn(endTransition)
            }
            function endTransition() {
               nodeCount--
               if (nodeCount === 0) {
                  entranceStateTime = 0;
               }
            }
         }
      }, {
         // retrack: true,
         phase: Phase.RENDER,
         __devName: 'mount conditional'
      })

      // // set up watcher for updates
      // watch($conditions, function updateConditional(newValue: boolean[], oldValue: boolean[]) {
      //     console.log("update conditional")
      //     if (areShallowEqualArrays(newValue, oldValue)) return;

      //     // (1)
      //     series.deactivateConditional()

      //     // (2)
      //     const activeIndex = series.evaluateConditions();

      //     // (3)
      //     pushDynamicNode(parentDynamicNode!)
      //     series.activateConditional(activeIndex, parent)
      //     popDynamicNode()

      // }, {
      //     // retrack: true,
      //     phase: Phase.RENDER,
      //     __devName: 'mount conditional'
      // })
      return this;
   }

   private render(index: number, parent: Element) {
      const kit = this.statements[index]
      return kit.renderConditional(parent, this.getNodePod(index))
   }

   // private appendConditional(
   //     activeIndex: number,
   //     parent: Element,
   //     fragment?: DocumentFragment,
   // ) {
   //     // const activationType = this.statements[activeIndex].type
   //     // const preserve = activationType === 'mount' ? true : false;
   //     try {
   //         pushContext(this.context)

   //         const nodeEntities = this.render(activeIndex, parent)
   //         // this.render(activeIndex, parent, nodePod, this.statements) //TODO: input from setupKit
   //         // append to dom (through existing fragment if any) and node pod
   //         // if (preserve) markMountPhase()
   //         mountNodeEntities(nodeEntities, parent, fragment)
   //         // if (preserve) unmarkMountPhase()
   //     }
   //     finally {
   //         popContext()
   //     }
   // }

   private deactivateConditional(index: number) {
      const activationType = this.statements[index].type
      console.log('deactivate conditional', index)
      if (activationType === 'show') {
         hidePrevConditionalNodes(this.dynamicNodePod, index);
      }
      else {
         const dynamicNode = this.dynamicNodes[index]
         if (activationType === 'create') {
            this.dynamicNodes[index] = NULLISH_DYNAMIC_NODE; // release reference
            this.setNodePod(index, NULLISH_NODE_POD)
            dynamicNode.destroy()
         }
         else if (activationType === 'mount') {
            dynamicNode.unmount()
         }
      }
   }

   private activateConditional( // mount conditional from effect
      activeIndex: number,
      parent: Element
   ) {

      // const activationType = this.statements[activeIndex].type
      // const preserve = activationType === 'create' ? false : true;
      // const series = this;
      // const dynamicNodePod = this.dynamicNodePod
      // // set up new conditional pod if needed
      // const _nodePod = dynamicNodePod[activeIndex]
      // const nodePod = _nodePod === NULLISH_NODE_POD || !_nodePod ? new _NodePod() : _nodePod;

      // let dynamicNode = this.dynamicNodes[activeIndex]
      // if (dynamicNode === undefined || dynamicNode === NULLISH_DYNAMIC_NODE) {
      //     dynamicNode = makeDynamicNode(preserve, nodePod);
      //     dynamicNode.mount(function renderConditionalUpdate() {
      //         const nodeEntities = series.render(activeIndex)
      //         if (preserve) markMountPhase()
      //         mountConditional(nodePod, parent, dynamicNodePod, nodeEntities);
      //         if (preserve) unmarkMountPhase()
      //     })
      //     series.storeDynamicNode(dynamicNode, activeIndex)
      // }
      // else {
      //     dynamicNode.reactivate(function updateConditional() {
      //         const nodeEntities = series.render(activeIndex);
      //         if (preserve) markMountPhase()
      //         if (activationType === 'show') {
      //             showConditionalNodes(parent, dynamicNodePod, activeIndex, nodeEntities)
      //         }
      //         else {
      //             series.replaceNodePod(activeIndex, nodePod);
      //             mountConditional(nodePod, parent, dynamicNodePod, nodeEntities)
      //         }
      //         if (preserve) unmarkMountPhase()
      //     })
      // }

      // const activeIndex = this.evaluateConditions()

      // const series = this;

      // const _nodePod = this.getNodePod(activeIndex)
      // const dynamicNode = makeDynamicNode(_nodePod)
      // dynamicNode.mount(function renderConditional() {
      //     series.appendConditional(activeIndex, parent, fragment)
      // })
      // this.storeDynamicNode(dynamicNode, activeIndex)

      //---------

      const activationType = this.statements[activeIndex].type
      // const preserve = activationType === 'mount' ? true : false;
      const series = this;
      const dynamicNodePod = this.dynamicNodePod
      // set up new conditional pod if needed
      const _nodePod = this.getNodePod(activeIndex)
      const nodePod = (_nodePod === NULLISH_NODE_POD || !_nodePod) ? new _NodePod() : _nodePod;
      this.setNodePod(activeIndex, nodePod)

      let dynamicNode = this.dynamicNodes[activeIndex]
      if (dynamicNode === undefined || dynamicNode === NULLISH_DYNAMIC_NODE) {
         dynamicNode = makeDynamicNode(nodePod);
         series.storeDynamicNode(dynamicNode, activeIndex)
         dynamicNode.mount(function renderConditionalUpdate() {
            const nodeEntities = series.render(activeIndex, parent)
            mountConditional(parent, dynamicNodePod, nodeEntities);
         })
      }
      else {
         console.log('reactivating conditional')
         // reactivate preserved nodes
         dynamicNode.reactivate(function updateConditional() {
            if (activationType === 'show') {
               const nodeEntities = series.render(activeIndex, parent);
               showConditionalNodes(parent, dynamicNodePod, activeIndex, nodeEntities)
            }
            else {
               const nodeEntities = series.render(activeIndex, parent);
               mountConditional(parent, dynamicNodePod, nodeEntities)
            }

         })
      }
   }
}

function toActivationType(swap: SwapType) {
   switch (swap) {
      case 'instance':
         return 'create'
      case 'mount':
         return 'mount'
      case 'display':
         return 'show'

      default:
         break;
   }
}


// export function remountConditional(
//     nodePod: _NodePod,
//     parent: Element,
//     dynamicPod: _DynamicNodePod,
// ) {
//     const fragment = new DocumentFragment();

//     nodePod.forEachNode(node => {
//         fragment.appendChild(node)
//     })

//     let prevSibling = dynamicPod.prevNode;
//     if (prevSibling && prevSibling === parent) parent.append(fragment) //for teleport
//     else if (prevSibling) prevSibling.after(fragment)
//     else parent.prepend(fragment)
// }

export function mountConditional(
   parent: Element,
   dynamicPod: _DynamicNodePod,
   nodeEntities: NodeKit[],
   fragment?: DocumentFragment
) {
   const _fragment = fragment || new DocumentFragment();

   // console.log('mount conditional: parent', parent)
   mountNodeEntities(nodeEntities, parent, _fragment) //TODO: pass in index in case it's in a list?
   // console.log('mount conditional: parent', parent)
   let prevSibling = dynamicPod.prevNode;
   if (prevSibling && prevSibling === parent) {
      // console.log('append', _fragment)
      parent.append(_fragment) //for teleport
   }
   else if (prevSibling) {
      // console.log('after', prevSibling, _fragment)
      prevSibling.after(_fragment)
   }
   else {
      // console.log('prepend', _fragment)
      parent.prepend(_fragment)
   }
   // console.log('none')
}



// function nullNodeRefValues(nodePod: _NodePod, components: InternalComponent[]) {
//     nodePod.forEachNode(node => {
//         const ref = getNodeRef(node);
//         if (ref && ref.o()) ref.setValue(undefined)
//     })
//     for (const component of components) {
//         const ref = getNodeRef(component.component);
//         if (ref && ref.o()) ref.setValue(null)
//     }
// }