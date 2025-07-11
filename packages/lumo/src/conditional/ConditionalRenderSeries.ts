import { getViewFlask } from "../flask/ViewFlask";
import { mountNodeEntities } from "../node/mountNodeKits";
import { ConditionalSeries } from "./ConditionalSeries";
import { hideDOMNodes, showDOMNodes } from "./toggledisplay";
import { areShallowEqualArrays, Ion, watch } from "../../../quarky/src";
import { getPhasicNode } from "../transition/PhasicNode";
import { TransitionNode } from "../transition/TransitionNode";
import { NodeEntity } from "../node/setUpNodeEntities";
import { DynamicPod, mountDOMNodes, NodePod, removeDOMNodes } from "../node/NodePod";
import { $_run_with_, $_snap_context } from "../../../flask/context/AsyncContext";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { FLASK, Flask } from "@rue/flask";
import { queueInternalRender, PRERENDER, RENDER, SYNC } from "../render-cycle";
import { ActivationType } from "./If";
import { useTransitionNodes } from "../transition/TransitNode";
import { RenderFunction, withGroupActivationReset } from "../node/makeNode";
import { Booleanny } from "@rue/types";
import { MaybeIon } from "../component/Input";
import { ConditionalSeriesKit, toRenderTransient, wrapToPreserve } from "../dynamic/DynamicKit";

//TODO: rename 'phasic node' to 'transition node'
//TODO: rename transitionNodes to 'transitNodes'
//TODO: rename TransitionNode to ???


function createDynamicConditionalKit(statementType: "if" | "elseIf" | "else", activationType: ActivationType | undefined, render: RenderFunction, $condition?: Ion<Booleanny>): DynamicConditionalRenderKit {
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()

   return {
      nodePod: undefined as unknown as NodePod,
      flask: undefined as Flask | undefined,
      statementType: statementType as 'if' | 'elseIf' | 'else',
      renderConditional: toRenderTransient(render, [REGISTER_TRANSITION_NODE(registerTransitionNode)]),
      type: activationType,
      transitionNodes,
      $condition
      // setup?: () => AnyObject,
      // phasicNode: TransitionNode | undefined,
   }
}

function toDynamicConditionalKits(kits: ConditionalKit[]): DynamicConditionalRenderKit[] {
   const dynamicKits = []
   for (const kit of kits) {
      if (!kit) continue;
      const { $condition, renderConditional, statementType, type } = kit
      dynamicKits.push(createDynamicConditionalKit(statementType, type, renderConditional, $condition))
   }
   return dynamicKits;
}




export type ConditionalKit = {
   statementType: "if" | "elseIf" | "else";
   renderConditional: RenderFunction;
   type: ActivationType | undefined;
   $condition: MaybeIon<Booleanny>
}

export type DynamicConditionalRenderKit = {
   nodePod: NodePod;
   flask: Flask | undefined;
   statementType: "if" | "elseIf" | "else";
   renderConditional: (parent: Element, nodePod: NodePod) => any[];
   type: ActivationType | undefined;
   transitionNodes: TransitionNode[];
   $condition: Ion<Booleanny> | undefined
}

// function makeElseKit(): DynamicConditionalRenderKit {
//    return {
//       nodePod: undefined as NodePod | undefined,
//       flask: undefined as Flask | undefined,
//       statementType: 'else' as 'if' | 'elseIf' | 'else',
//       renderConditional: () => [],
//       type: 'create',
//       transitionNodes: [],
//       $condition: undefined
//    }
// }

export class ConditionalRenderSeries extends ConditionalSeries {
   declare statements: (DynamicConditionalRenderKit | undefined)[];

   // store contextual state
   context: Map<string | symbol, any> = $_snap_context()
   outerFlask: Flask = getViewFlask()
   phasicNode: TransitionNode | null = getPhasicNode()

   dynamicPod: DynamicPod = new NodePod()
   __DEV__asyncPath = __DEV__ ? __DEV__buildAsyncPath() : undefined

   /* We render all show statements eagerly to prevent buggy rendering */
   showKits: DynamicConditionalRenderKit[] | undefined

   constructor(
      statements: ConditionalKit[],
      activationType: ActivationType = 'create'
   ) {
      const kits = toDynamicConditionalKits(statements)
      super(kits);

      if (__DEV__) this.context.set(TRACE, this.__DEV__asyncPath)

      this.activeIndex = this.evaluateConditions()
      // populate dynamic node pod
      // 'create' kits share a single node pod
      // This way, we can mount 'create' efficiently without having 
      // to traverse empty 'create' node pods when looking for previous sibling
      const dynamicPod = this.dynamicPod
      let sharedPod: NodePod | undefined;
      let showKits: DynamicConditionalRenderKit[] | undefined

      for (const kit of kits) {
         if (!kit) return;
         if (!kit.type) kit.type = activationType;
         if (kit.type === 'show') {
            showKits = showKits || (showKits = this.showKits = [])
            showKits.push(kit);
            dynamicPod.push(kit.nodePod = new NodePod())
         }
         else if (kit.type === 'mount') {
            dynamicPod.push(kit.nodePod = new NodePod(false))
            kit.renderConditional = wrapToPreserve(kit.renderConditional)
         }
         else {
            kit.nodePod = sharedPod || (sharedPod = new NodePod(false), dynamicPod.push(sharedPod), sharedPod)
         }
      }
   }

   activeIndex: number;

   mount( // the initial mount after setup
      parent: Element,
      fragment?: DocumentFragment
   ) {
      // mount show statements
      this.showKits?.forEach(showKit => {
         this.render(showKit, parent, fragment)
         hideDOMNodes(showKit.nodePod)
      })

      this.activateConditional(this.activeIndex, parent, fragment)
   }


   /**
    * set up watcher for updates, which involves:
    * • calling the render function
    * > processing the jsx output (setup node entities)
    * > mounting to a new fragment
    * > mounting fragement to appropriate node (parent.append(fragment), sibling.after(fragment))
    * 
    * @param parent 
    * @param outerNodePod 
    * @returns 
    */
   setUp(
      parent: Element,
      // outerNodePod: NodePod,
   ) {
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
         console.log('update conditional?')

         const prevIndex = series.activeIndex!;
         const activeIndex = series.evaluateConditions();
         if (prevIndex === activeIndex) {
            return;
         }
         console.log('update conditional, yes')

         const outgoingNodes = series.statements[prevIndex]?.transitionNodes ?? []
         const incomingNodes = series.statements[activeIndex]?.transitionNodes ?? []
         const activationType = series.statements[activeIndex]?.type;
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
         // phase: POSTEVENT,
         phase: PRERENDER,
      })

      // // set up watcher for updates
      // watch($conditions, function updateConditional(newValue: boolean[], oldValue: boolean[]) {
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

   private render(kit: DynamicConditionalRenderKit, parent: Element, fragment?: DocumentFragment) {
      const context = this.context;
      const flask = kit.flask
      if (flask) context.set(FLASK, flask); //NOTE: flask is optional b/c/ show kits don't need flask

      $_run_with_(context, () => {
         const nodeEntities = kit.renderConditional(parent, kit.nodePod)
         mountConditional(parent, kit.nodePod, nodeEntities, fragment);
      })
   }

   private deactivateConditional(index: number) {
      const kit = this.statements[index]
      if (!kit) return;
      const pod = kit.nodePod!
      const activationType = kit.type
      if (activationType === 'show') {
         // queueInternalRender(() => {
            // preserve dynamic node and node pod
            hideDOMNodes(pod);
         // })
      }
      else if (activationType === 'create') {
         // discard of flask
         const flask = kit.flask!
         kit.flask = undefined; // 
         flask.emitDiscard() //

         // queueInternalRender(() => {
            // remove from 
            removeDOMNodes(pod)
            pod.clear() //
         // })
      }
      else if (activationType === 'mount') {
         const flask = kit.flask
         flask?.emitDemount() //
         // queueInternalRender(() => {
            removeDOMNodes(pod);
         // })
      }
   }

   private activateConditional( // mount conditional from effect
      activeIndex: number,
      parent: Element,
      fragment?: DocumentFragment
   ) {
      const kit = this.statements[activeIndex]
      if (!kit) return;
      const activationType = kit.type
      const nodePod = kit.nodePod

      if (activationType === 'show') { //NOTE: 'show' statements are not dynamic nodes because they are not removed from the DOM and setup is not rerun
         // queueInternalRender(() => {
            showDOMNodes(nodePod)
         // })
         return;
      }

      const isInitialMount = kit.flask === undefined
      const flask = kit.flask ?? (kit.flask = this.outerFlask.spawn({ type: 'view', creationScope: kit.type === "create" }))
      // queueInternalRender(() => {
         this.render(kit, parent, fragment)
         nodePod.activate()
         if (isInitialMount)
            flask.emitInitialMount()
         else
            flask.emitRemount() // remount preserved watchers etc.
      // })
   }
}

// Two types of NodePods: SeriesPod and Pod
// SeriesPod: [Pod, Pod] (can only contain pods)
// Pod: [node, node, SeriesPod] (may contain dom nodes and series pods


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




