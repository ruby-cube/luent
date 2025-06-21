import { getViewFlask } from "../flask/ViewFlask";
import { mountNodeEntities } from "../node/mountNodeKits";
import { ConditionalSeries } from "./ConditionalSeries";
import { hideDOMNodes, showDOMNodes } from "./toggledisplay";
import { areShallowEqualArrays, watch } from "../../../quarky/src";
import { getPhasicNode } from "../transition/PhasicNode";
import { TransitionNode } from "../transition/TransitionNode";
import { NodeEntity } from "../node/setUpNodeEntities";
import { NodePod } from "../node/NodePod";
import { $_run_with_, $_snap_context } from "../../../flask/context/AsyncContext";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { FLASK, Flask } from "@rue/flask";
import { POSTEVENT } from "../render-cycle";
import { ActivationType, ConditionalRenderKit } from "./If";


function makeElseKit(): ConditionalRenderKit {
   return {
      nodePod: undefined as NodePod | undefined,
      flask: undefined as Flask | undefined,
      statementType: 'else' as 'if' | 'elseIf' | 'else',
      renderConditional: () => [],
      type: 'create',
      transitionNodes: [],
      $condition: undefined
   }
}

export class ConditionalRenderSeries extends ConditionalSeries {
   declare statements: ConditionalRenderKit[];

   nodePod!: NodePod;

   context: Map<string | symbol, any>;

   __DEV__asyncPath?: string

   activeIndex: number;

   isDynamic: boolean = true;

   constructor(
      statements: ConditionalRenderKit[],
   ) {
      super(statements, makeElseKit);

      this.context = $_snap_context()

      this.__DEV__asyncPath = __DEV__ ? __DEV__buildAsyncPath() : undefined

      this.outerFlask = getViewFlask() //ie: enclosingFlask

      this.activeIndex = this.evaluateConditions()

      if (!this.isDynamic) {
         return;
      };

      const dynamicPod = this.nodePod = new NodePod()

      dynamicPod.activate()

      // populate dynamic node pod
      // 'create' kits share a single node pod
      // This way, we can mount 'create' efficiently without having 
      // to traverse empty 'create' node pods when looking for previous sibling

      for (const kit of statements) {
         kit.nodePod = dynamicPod.appendNodePod(false)
         kit.renderConditional = wrapToPreserve(kit.renderConditional)
      }
   }




   mount( // the initial mount after setup
      parent: Element,
      fragment?: DocumentFragment
   ) {
      const activeIndex = this.activeIndex

      const kit = this.statements[activeIndex]
      kit.nodePod!.activate()

      if (!this.isDynamic) {
         this.render(kit, parent, fragment) //TODO: render function is not wrapped in context because dynamicNode does it... why doesn't 'mount' get a dynamic node???
      }
      else {
         const flask = kit.flask = this.outerFlask.spawn({ type: 'view', creationScope: kit.type === 'create' })
         this.render(kit, parent, fragment, flask)
         flask.emitInitialMount() // emits mount hook
      }
   }



   outerFlask: Flask

   setUp(
      parent: Element,
      outerNodeVine: NodePod,
   ) {
      if (!this.isDynamic) {
         this.nodePod = outerNodeVine;
         //TODO: static conditional
         return this;
      }

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
      watch($conditions, function updateConditional({ current, previous }) {
         if (areShallowEqualArrays(current!, previous!)) return;

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
               return; // if unmount fails, we don't activate the new conditional
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
            series.activateConditional(activeIndex, parent)
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
         phase: POSTEVENT,
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
      //     pushDynamicNode(outerFlask!)
      //     series.activateConditional(activeIndex, parent)
      //     popDynamicNode()

      // }, {
      //     // retrack: true,
      //     phase: Phase.RENDER,
      //     __devName: 'mount conditional'
      // })
      return this;
   }

   private render(kit: ConditionalRenderKit, parent: Element, fragment?: DocumentFragment, flask?: Flask) {
      const context = this.context;
      if (flask) context.set(FLASK, flask);
      if (__DEV__) context.set(TRACE, this.__DEV__asyncPath)

      $_run_with_(context, () => {
         const nodeEntities = kit.renderConditional(parent, kit.nodePod || (console.warn('DEV RESEARCH: no kit pod :('), this.nodePod))
         mountConditional(parent, kit.nodePod!, nodeEntities, fragment);
      })
   }

   private deactivateConditional(index: number) {
      console.log('deactivating conditional')
      const kit = this.statements[index]
      const pod = kit.nodePod!
      const activationType = kit.type
      if (activationType === 'show') {
         // preserve dynamic node and node pod
         hideDOMNodes(pod);
      }
      else if (activationType === 'create') {
         // discard of flask
         console.log('kit', kit)
         const flask = kit.flask!
         kit.flask = undefined;
         flask.emitDiscard()

         // remove from 
         removeDOMNodes(pod)
         pod.length = 0;
      }
      else if (activationType === 'mount') {
         const flask = kit.flask
         flask?.emitDemount()
         removeDOMNodes(pod);
      }
   }

   private activateConditional( // mount conditional from effect
      activeIndex: number,
      parent: Element
   ) {
      const kit = this.statements[activeIndex]
      const activationType = kit.type
      const isInitialMount = !kit.nodePod
      const pod = kit.nodePod || (kit.nodePod = this.nodePod.appendNodePod())

      if (activationType === 'show') { //NOTE: 'show' statements are not dynamic nodes because they are not removed from the DOM and setup is not rerun
         showDOMNodes(pod)
         return;
      }
      pod.activate()

      const flask = kit.flask ?? (kit.flask = this.outerFlask.spawn({ type: 'view', creationScope: kit.type === "create" }))
      this.render(kit, parent, undefined, flask)
      if (activationType === 'create' || isInitialMount)
         flask.emitInitialMount()
      else
         flask.emitRemount() // remount preserved watchers etc.
      console.log('activate conditional', pod)
   }
}



export function mountConditional(
   parent: Element,
   pod: NodePod,
   nodeEntities: NodeEntity[],
   fragment?: DocumentFragment
) {
   const _fragment = fragment || new DocumentFragment();
   mountNodeEntities(nodeEntities, parent, _fragment) //TODO: pass in index in case it's in a list?
   if (fragment) return; // no need to mount to DOM yet since fragment originates higher up
   mountDOMNodes(pod, parent, _fragment)
}


export function mountDOMNodes(pod: NodePod, parent: Element, fragment: DocumentFragment) {
   let prevNode = pod.prevNode;
   if (prevNode && prevNode === parent) {
      parent.append(fragment) //for teleport
   }
   else if (prevNode) {
      prevNode.after(fragment)
   }
   else {
      parent.prepend(fragment)
   }
}

export function removeDOMNodes(pod: NodePod) {
   console.log('remove domnodes', pod)
   pod.forEachNode(node => {
      console.log('for each node', node)
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


function wrapToPreserve(renderConditional: (parent: Element, nodePod: NodePod) => NodeEntity[]) {
   let nodeEntities: NodeEntity[];
   return (parent: Element, nodePod: NodePod) => {
      if (nodeEntities) return nodeEntities;
      return nodeEntities = renderConditional(parent, nodePod)
   }
}
