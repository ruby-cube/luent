import { makeDynamicNode } from "../dynamic/makeDynamicNode";
import { DynamicNode, NULLISH_DYNAMIC_NODE } from "../dynamic/DynamicNode";
import { NodeEntity, SwapType } from "../node/makeNode";
import { mountNodeEntities } from "../node/mountNodeEntity";
import { ConditionalRenderKit } from "./ConditionalRenderKit";
import { ConditionalSeries } from "./ConditionalSeries";
import { hideDOMNodes, showDOMNodes } from "./toggledisplay";
import { watch } from "../watch/watchAndPreserve";
import { areShallowEqualArrays, Phase } from "../../../quarky/src";
import { getActiveDynamicNode, popDynamicNode, pushDynamicNode } from "../dynamic/nodestack";
import { popCommons, pushCommons, Context } from "../context/context-stack";
import { getPhasicNode } from "../transition/PhasicNode";
import { TransitionNode } from "../transition/TransitionNode";
import { NodeKit } from "../node/setUpNodeEntities";
import { NodePod } from "../node/NodePod";

//TODO: rename 'phasic node' to 'transition node'
//TODO: rename transitionNodes to 'transitNodes'
//TODO: rename TransitionNode to ???



export class ConditionalRenderSeries extends ConditionalSeries {
   declare statements: ConditionalRenderKit[];

   nodePod!: NodePod;

   phasicNode?: TransitionNode

   /* We render all show statements eagerly to prevent buggy rendering */
   showKits: ConditionalRenderKit[] | undefined

   constructor(
      statements: ConditionalRenderKit[],
      makeElseKit: () => ConditionalRenderKit,
      swap: SwapType = 'create'
   ) {
      super(statements, makeElseKit);
      this.activeIndex = this.evaluateConditions()
      if (!this.isDynamic) {
         return;
      };
      this.phasicNode = getPhasicNode();
      const dynamicPod = this.nodePod = new NodePod()
      dynamicPod.activate()
      // populate dynamic node pod
      // 'create' kits share a single node pod
      // This way, we can mount 'create' efficiently without having 
      // to traverse empty 'create' node pods when looking for previous sibling
      let sharedPod: NodePod | undefined;
      let showKits: ConditionalRenderKit[] | undefined

      for (const kit of statements) {
         if (!kit.type) kit.type = swap;
         if (kit.type === 'show') {
            showKits = showKits || (showKits = this.showKits = [])
            showKits.push(kit);
            kit.nodePod = dynamicPod.appendNodePod(false)
            //QUESTION: Does the order of the nodeVines in the dynamicPod need to match the order of rendering? so far there's no problemt
         }
         else if (kit.type === 'mount') {
            kit.nodePod = dynamicPod.appendNodePod(false)
            kit.renderConditional = wrapToPreserve(kit.renderConditional)
         }
         else {
            sharedPod = sharedPod || (sharedPod = dynamicPod.appendNodePod(false))
            kit.nodePod = sharedPod;
         }
      }
   }

   activeIndex: number;
   isDynamic: boolean = true;


   mount( // the initial mount after setup
      parent: Element,
      fragment?: DocumentFragment
   ) {
      const series = this;
      // evaluate conditions and render
      const activeIndex = this.activeIndex

      const kit = this.statements[activeIndex]
      kit.nodePod!.activate()

      if (this.isDynamic && kit.type === 'create') {
         const dynamicNode = kit.dynamicNode = makeDynamicNode()
         dynamicNode.mount(renderConditional)
      }
      else if (kit.type !== 'show') {
         renderConditional()
      }

      const showKits = this.showKits
      if (showKits)
         for (const showKit of showKits) {
            const pod = showKit.nodePod!
            const nodeEntities = series.render(showKit, parent, true)
            mountConditional(parent, pod, nodeEntities, fragment);
            pod.activate()
            if (showKit !== kit) hideDOMNodes(pod)
         }

      function renderConditional() {
         const nodeEntities = series.render(kit, parent, true)
         mountConditional(parent, kit.nodePod!, nodeEntities, fragment);
      }
   }

   setUp(
      parent: Element,
      outerNodeVine: NodePod,
   ) {
      if (!this.isDynamic) {
         this.nodePod = outerNodeVine;
         //TODO: static conditional
         return this;
      }
      const parentDynamicNode = getActiveDynamicNode()
      outerNodeVine.append(this.nodePod!)
      const $conditions = this.getConditionsIon()
      const phasicNode = this.phasicNode
      const series = this;

      let entranceStateTime = 0;
      let exitStateTime = 0;
      let outgoingIndex: number | undefined;
      let newTransitionIn: (() => void) | undefined;
      let prevOutgoingNodes: TransitionNode[];
      let prevIncomingNodes: TransitionNode[];

      // set up watcher for updates
      watch($conditions, function updateConditional({newState, oldState}) {
         console.log("update conditional==================", newState, oldState)
         if (areShallowEqualArrays(newState!, oldState!)) return;

         const prevIndex = series.activeIndex!;
         const activeIndex = series.evaluateConditions();
         if (prevIndex === activeIndex) {
            return;
         }

         const outgoingNodes = series.statements[prevIndex].transitionNodes
         const incomingNodes = series.statements[activeIndex].transitionNodes
         const activationType = series.statements[activeIndex].type;
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

   private render(kit: ConditionalRenderKit, parent: Element, initialRender: boolean = false) {
      return kit.renderConditional(parent, kit.nodePod || (console.log('no kit pod :('), this.nodePod), initialRender)
   }

   private deactivateConditional(index: number) {
      const kit = this.statements[index]
      const pod = kit.nodePod!
      const activationType = kit.type
      if (activationType === 'show') {
         console.log('deactivate conditional', index)
         // preserve dynamic node and node pod
         hideDOMNodes(pod);
      }
      else if (activationType === 'create') {
         // remove from 
         removeDOMNodes(pod)
         kit.nodePod!.length = 0;

         // dispose of flask
         const dynamicNode = kit.dynamicNode!
         kit.dynamicNode = undefined;
         dynamicNode.destroy()
      }
      else if (activationType === 'mount') {
         removeDOMNodes(pod);
         // TODO: maybe deactivate dynamic node so that effects won't run?
      }
   }

   private activateConditional( // mount conditional from effect
      activeIndex: number,
      parent: Element
   ) {
      const kit = this.statements[activeIndex]
      const activationType = kit.type
      const pod = kit.nodePod || (kit.nodePod = this.nodePod.appendNodePod())

      if (activationType === 'show') { //NOTE: 'show' statements are not dynamic nodes because they are not removed from the DOM and setup is not rerun
         showDOMNodes(pod)
         return;
      }
      pod.activate()
      const series = this;

      let dynamicNode = kit.dynamicNode
      if (dynamicNode === undefined || dynamicNode === NULLISH_DYNAMIC_NODE) {
         dynamicNode = kit.dynamicNode = makeDynamicNode();
         dynamicNode.mount(function renderConditionalUpdate() {
            const nodeEntities = series.render(kit, parent)
            mountConditional(parent, pod, nodeEntities);
         })
      }
      else {
         // reactivate preserved nodes
         dynamicNode.reactivate(function updateConditional() {
            const nodeEntities = series.render(kit, parent);
            mountConditional(parent, pod, nodeEntities)
         })
      }
   }
}



export function mountConditional(
   parent: Element,
   pod: NodePod,
   nodeEntities: NodeKit[],
   fragment?: DocumentFragment
) {
   const _fragment = fragment || new DocumentFragment();

   mountNodeEntities(nodeEntities, parent, _fragment) //TODO: pass in index in case it's in a list?

   console.log('START search for prev Node -----------------')
   let prevNode = pod.prevNode;
   console.log('END search for prev Node -----------------')
   console.log('outer node pod', pod.pod!.pod)
   console.log('dynamic node pod', pod.pod)
   console.log('nodePod', pod)
   console.log('prevNode', prevNode)
   if (prevNode && prevNode === parent) {
      parent.append(_fragment) //for teleport
   }
   else if (prevNode) {
      prevNode.after(_fragment)
   }
   else {
      parent.prepend(_fragment)
   }
}

export function removeDOMNodes(pod: NodePod) {
   pod.forEachNode(node => {
      node.remove()
   })
   pod.deactivate()
}

// function nullNodeRefValues(nodePod: NodePod, components: InternalComponent[]) {
//     nodePod.forEachNode(node => {
//         const ref = getNodeRef(node);
//         if (ref && ref.o()) ref.setValue(undefined)
//     })
//     for (const component of components) {
//         const ref = getNodeRef(component.component);
//         if (ref && ref.o()) ref.setValue(null)
//     }
// }


function wrapToPreserve(renderConditional: (parent: Element, nodePod: NodePod, initialRender?: boolean) => NodeKit[]) {
   let nodeEntities: NodeKit[];
   return (parent: Element, nodePod: NodePod, initialRender?: boolean) => {
      if (nodeEntities) return nodeEntities;
      return nodeEntities = renderConditional(parent, nodePod, initialRender)
   }
}
