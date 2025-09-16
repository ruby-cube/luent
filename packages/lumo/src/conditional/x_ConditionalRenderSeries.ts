import { ConditionalSeries } from "./x_ConditionalSeries";
import { Ion } from "../../../quarky/src";
import { getPhasicNode } from "../transition/PhasicNode";
import { TransitionNode } from "../transition/TransitionNode";
import { NodeEntity } from "../node/x_setUpNodeEntities";
import { DynamicPod, mountFragment, NodePod, removeDOMNodes } from "../node/x_NodePod";
import { $_run_with_, $_snap_context, ContextSnapshot } from "../../../flask/context/AsyncContext";
import { __DEV__buildAsyncPath } from "../../../flask/debug";
import { FLASK, Flask, getFlask } from "@rue/flask";
import { queueInternalRenderTask, watchToRender } from "../render-cycle";
import { ActivationType } from "./If";
import { useTransitionNodes } from "../transition/TransitNode";
import { RenderFunction } from "../node/makeJSXNode";
import { Booleanny } from "@rue/types";
import { MaybeIon } from "../component/Input";
import { toRenderTransient, wrapToPreserve } from "../node/x_DynamicKit";
import { createCommonsNode } from "../commons/Commons";

//TODO: rename 'phasic node' to 'transition node'
//TODO: rename transitionNodes to 'transitNodes'
//TODO: rename TransitionNode to ???
// function queueInternalRenderTask(fn){
//    fn()
// }

function createDynamicConditionalKit(statementType: "if" | "elseIf" | "else", activationType: ActivationType | undefined, render: RenderFunction, context: ContextSnapshot, $condition?: Ion<Booleanny>): DynamicConditionalRenderKit {
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes() //TODO:

   const commons = createCommonsNode([REGISTER_TRANSITION_NODE(registerTransitionNode)])


   return {
      nodePod: undefined as unknown as NodePod,
      flask: undefined as Flask | undefined,
      statementType: statementType as 'if' | 'elseIf' | 'else',
      renderConditional: toRenderTransient(render, context, commons),
      type: activationType,
      transitionNodes,
      $condition
      // setup?: () => AnyObject,
      // phasicNode: TransitionNode | undefined,
   }
}

function toDynamicConditionalKits(kits: ConditionalKit[], context: ContextSnapshot): DynamicConditionalRenderKit[] {
   const dynamicKits = []
   for (const kit of kits) {
      if (!kit) continue;
      const { $condition, render, statementType, type } = kit
      dynamicKits.push(createDynamicConditionalKit(statementType, type, render, context, $condition))
   }
   return dynamicKits;
}




export type ConditionalKit = {
   statementType: "if" | "elseIf" | "else";
   render: RenderFunction;
   type: ActivationType | undefined;
   $condition: MaybeIon<Booleanny>
   discard: (()=>void) | undefined
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
   context: ContextSnapshot;
   outerFlask: Flask = getFlask()
   phasicNode: TransitionNode | null = getPhasicNode()

   dynamicPod: DynamicPod = new NodePod()

   /* We render all show statements eagerly to prevent buggy rendering */
   showKits: DynamicConditionalRenderKit[] | undefined

   constructor(
      statements: ConditionalKit[],
      activationType: ActivationType = 'create'
   ) {
      if (statements.at(-1)?.statementType !== 'else') statements.push({
         statementType: "else",
         renderConditional: () => "",
         type: activationType,
         $condition: undefined
      })
      const context = $_snap_context()
      console.log('context', context)
      const kits = toDynamicConditionalKits(statements, { ...context })

      super(kits);

      this.context = context;

      // populate dynamic node pod
      // 'create' kits share a single node pod
      // This way, we can mount 'create' efficiently without having 
      // to traverse empty 'create' node pods when looking for previous sibling
      const dynamicPod = this.dynamicPod
      let sharedPod: NodePod | undefined;
      let showKits: DynamicConditionalRenderKit[] | undefined

      for (const kit of kits) {
         if (!kit) continue;
         if (!kit.type) kit.type = activationType;
         if (kit.type === 'show') {
            showKits = showKits || (showKits = this.showKits = [])
            showKits.push(kit);
            dynamicPod.push(kit.nodePod = new NodePod())
         }
         else if (kit.type === 'remount') {
            dynamicPod.push(kit.nodePod = new NodePod(false))
            kit.renderConditional = wrapToPreserve(kit.renderConditional)
         }
         else {
            kit.nodePod = sharedPod || (sharedPod = new NodePod(false), dynamicPod.push(sharedPod), sharedPod)
         }
      }

   }

   mount( // the initial mount after setup
      parent: Element,
      fragment?: DocumentFragment
   ) {
      // mount show statements
      this.showKits?.forEach(showKit => {
         this.render(showKit, parent, fragment)
         hideDOMNodes(showKit.nodePod)
      })

      this.activateConditional(this.$activeIndex(), parent, fragment)
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
      const $activeIndex = this.$ActiveIndex()

      const phasicNode = this.phasicNode
      const series = this;

      let entranceStateTime = 0;
      let exitStateTime = 0;
      let outgoingIndex: number | undefined;
      let newTransitionIn: (() => void) | undefined;
      let prevOutgoingNodes: TransitionNode[];
      let prevIncomingNodes: TransitionNode[];

      // set up watcher for updates
      watchToRender($activeIndex, function updateConditional({ current: activeIndex, previous: prevIndex }) {

         if (prevIndex === activeIndex) {
            return;
         }

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
      }, this.outerFlask)

      // // set up watcher for updates
      // watch($conditions, function updateConditional(newValue: boolean[], oldValue: boolean[]) {
      //     if (areShallowEqualArrays(newValue, oldValue)) return;

      //     // (1)
      //     series.deactivateConditional()

      //     // (2)
      //     const activeIndex = series.$activeIndex();

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
      const context = { ...this.context };
      const flask = kit.flask

      $_run_with_(context, () => {
         const nodeEntities = kit.renderConditional(parent, kit.nodePod)
         mountConditional(parent, kit.nodePod, nodeEntities, this.outerFlask, fragment);
      }, {
         [FLASK]: flask
      })
   }

   private deactivateConditional(index: number) {
      const kit = this.statements[index]
      if (!kit) return;
      const pod = kit.nodePod!
      const activationType = kit.type
      if (activationType === 'show') {
         queueInternalRenderTask(() => {
            // preserve dynamic node and node pod
            hideDOMNodes(pod);
         }, this.outerFlask)
      }
      else if (activationType === 'create') {
         // discard of flask
         const flask = kit.flask!
         kit.flask = undefined; // 
         flask.emitDiscard() //

         queueInternalRenderTask(() => {
            removeDOMNodes(pod)
            pod.clear() //
         }, this.outerFlask)
      }
      else if (activationType === 'remount') {
         const flask = kit.flask
         flask?.emitDemount() //
         queueInternalRenderTask(() => {
            removeDOMNodes(pod);
         }, this.outerFlask)
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
      const isInitialMount = kit.flask === undefined

      if (activationType === 'show' && !isInitialMount) { //NOTE: 'show' statements are not dynamic nodes because they are not removed from the DOM and setup is not rerun
         queueInternalRenderTask(() => {
            showDOMNodes(nodePod)
         }, this.outerFlask)
         return;
      }

      const flask = kit.flask ?? (kit.flask = this.outerFlask.spawn({ type: 'view', creationScope: kit.type === "create" }))

      queueInternalRenderTask(() => {
         this.render(kit, parent, fragment)
         nodePod.activate() // needs to be queued since deactivation is also queued
         if (isInitialMount)
            flask.emitInitialMount()
         else
            flask.emitRemount() // remount preserved watchers etc.
      }, this.outerFlask)
   }
}

// Two types of NodePods: SeriesPod and Pod
// SeriesPod: [Pod, Pod] (can only contain pods)
// Pod: [node, node, SeriesPod] (may contain dom nodes and series pods


export function mountConditional(
   parent: Element,
   pod: NodePod,
   nodeEntities: NodeEntity[],
   flask: Flask,
   fragment?: DocumentFragment
) {
   const _fragment = fragment || new DocumentFragment();

   mountNodeEntities(nodeEntities, parent, _fragment) //TODO: pass in index in case it's in a list?
   if (fragment) {
      return; // no need to mount to DOM yet since fragment originates higher up
   }

   queueInternalRenderTask(() => {
      // console.log('$$$ mount domnodes to DOM')
      mountFragment(pod, parent, _fragment)
   }, flask)
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




