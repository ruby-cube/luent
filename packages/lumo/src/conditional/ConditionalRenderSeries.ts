import { getViewFlask } from "../flask/ViewFlask";
import { mountNodeEntities } from "../node/mountNodeKits";
import { ConditionalSeries } from "./ConditionalSeries";
import { hideDOMNodes, showDOMNodes } from "./toggledisplay";
import { areShallowEqualArrays, Ion, watch } from "../../../quarky/src";
import { getPhasicNode } from "../transition/PhasicNode";
import { TransitionNode } from "../transition/TransitionNode";
import { NodeEntity, setUpNodeEntities } from "../node/setUpNodeEntities";
import { NodePod } from "../node/NodePod";
import { $_run_with_, $_snap_context } from "../../../flask/context/AsyncContext";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { FLASK, Flask } from "@rue/flask";
import { POSTEVENT } from "../render-cycle";
import { ActivationType } from "./If";
import { useTransitionNodes } from "../transition/TransitNode";
import { RenderFunction, withGroupActivationReset } from "../node/makeNode";
import { Booleanny } from "@rue/types";
import { getClosestCommons } from "../commons/commons-stack";
import { Provided, wrapWithCommons } from "../commons/Commons";
import { normalizeToArray } from "@rue/utils";
import { MaybeIon } from "../component/Input";

//TODO: rename 'phasic node' to 'transition node'
//TODO: rename transitionNodes to 'transitNodes'
//TODO: rename TransitionNode to ???


function createDynamicConditionalKit(statementType: "if" | "elseIf" | "else", activationType: ActivationType | undefined, render: RenderFunction, $condition?: Ion<Booleanny>): DynamicConditionalRenderKit {
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes()

   return {
      nodePod: undefined as NodePod | undefined,
      flask: undefined as Flask | undefined,
      statementType: statementType as 'if' | 'elseIf' | 'else',
      renderConditional: renderWithCommons(render, [REGISTER_TRANSITION_NODE(registerTransitionNode)]),
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
      const { $condition, renderConditional, statementType, type } = kit
      dynamicKits.push(createDynamicConditionalKit(statementType, type, renderConditional, $condition))
   }
   return dynamicKits;
}


export type RenderConditional = (parent: Element, nodePod: NodePod) => NodeEntity[]

function renderWithCommons(renderConditional: RenderFunction, provide: Provided) {
   const parentCommons = getClosestCommons()
   if (!parentCommons) throw new Error('commons missing')
   return (parent: Element, nodePod: NodePod) =>
      setUpNodeEntities(normalizeToArray(wrapWithCommons(provide, () => withGroupActivationReset(renderConditional), parentCommons)), parent, nodePod)
}

export type ConditionalKit = {
   statementType: "if" | "elseIf" | "else";
   renderConditional: RenderFunction;
   type: ActivationType | undefined;
   $condition: MaybeIon<Booleanny>
}

export type DynamicConditionalRenderKit = {
   nodePod: NodePod | undefined;
   flask: Flask | undefined;
   statementType: "if" | "elseIf" | "else";
   renderConditional: (parent: Element, nodePod: NodePod) => any[];
   type: ActivationType | undefined;
   transitionNodes: TransitionNode[];
   $condition: Ion<Booleanny> | undefined
}

function makeElseKit(): DynamicConditionalRenderKit {
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
   declare statements: DynamicConditionalRenderKit[];

   nodePod!: NodePod;

   phasicNode?: TransitionNode | null

   /* We render all show statements eagerly to prevent buggy rendering */
   showKits: DynamicConditionalRenderKit[] | undefined
   context: Map<string | symbol, any>;
   __DEV__asyncPath?: string

   constructor(
      statements: ConditionalKit[],
      activationType: ActivationType = 'create'
   ) {
      const kits = toDynamicConditionalKits(statements)
      super(kits, makeElseKit);

      this.context = $_snap_context()
      this.__DEV__asyncPath = __DEV__ ? __DEV__buildAsyncPath() : undefined
      this.outerFlask = getViewFlask() //ie: enclosingFlask
      console.log('$$$ outerFlask', this.outerFlask)
      this.activeIndex = this.evaluateConditions()

      this.phasicNode = getPhasicNode();
      const dynamicPod = this.nodePod = new NodePod()
      dynamicPod.activate()
      // populate dynamic node pod
      // 'create' kits share a single node pod
      // This way, we can mount 'create' efficiently without having 
      // to traverse empty 'create' node pods when looking for previous sibling
      let sharedPod: NodePod | undefined;
      let showKits: DynamicConditionalRenderKit[] | undefined

      for (const kit of kits) {
         if (!kit.type) kit.type = activationType;
         if (kit.type === 'show') {
            showKits = showKits || (showKits = this.showKits = [])
            showKits.push(kit);
            kit.nodePod = dynamicPod.appendNodePod() //FIX:
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

   mount( // the initial mount after setup
      parent: Element,
   ) {
      const activeIndex = this.activeIndex

      const kit = this.statements[activeIndex]
      kit.nodePod!.activate()

      if (kit.type !== 'show') {
         const flask = kit.flask = this.outerFlask.spawn({ type: 'view', creationScope: kit.type === 'create' })
         this.render(kit, parent, flask)
         flask.emitInitialMount() // emits mount hook
      }

      const showKits = this.showKits
      if (showKits)
         for (const showKit of showKits) {
            const pod = showKit.nodePod!
            this.render(showKit, parent)

            if (showKit !== kit) hideDOMNodes(pod)
         }
   }

   outerFlask: Flask

   setUp(
      parent: Element,
      outerNodePod: NodePod,
   ) {

      outerNodePod.append(this.nodePod!)
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

   private render(kit: DynamicConditionalRenderKit, parent: Element | DocumentFragment, flask?: Flask) {
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

