import { $_run_with_, $_snap_context, ContextSnapshot, FLASK, Flask, getActiveFlask, getFlask } from "@rue/flask";
import { AsyncRender, DOMNode, forEachNode, JSXNode, mountDOMNodes, mountFragment, processJSXOutput, removeDOMNodes, setUpNodeVine, toAsyncRender, VineNode } from "../node/VineNode"
import { ActivationType } from "./If";
import { TransitionNode } from "../transition/TransitionNode";
import { $_derivation, $activeUpdate, getSuspenseCount, Ion, popUpdate, PRELUDE, pushUpdate, queueInternalRender, queueTask, Suspense, swiftUpdate, watchToRender } from "@rue/quarky";
import { Booleanny } from "@rue/types";
import { RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { COMMONS, CommonsNode } from "../context/context-stack";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { FromTag, MaybeIon, RenderSlot } from "../component/Input";
import { createCommonsNode } from "../context/Context";
import { useTransitionNodes } from "../transition/TransitNode";
import { isPlainObject } from "@rue/utils";


export type ConditionalKit = {
   statementType: "if" | "elseIf" | "else";
   render: RenderFunction;
   type: ActivationType | undefined;
   $condition: MaybeIon<Booleanny>
   pending: Suspense | undefined
   // discard: (() => void) | undefined
}


export type DynamicConditionalRenderKit = {
   // discard: (() => void) | undefined
   nodes: (JSXNode[]) | null
   flask: Flask | undefined;
   statementType: "if" | "elseIf" | "else";
   type: ActivationType | undefined;
   render: AsyncRender;
   transitionNodes: TransitionNode[];
   $condition: Ion<Booleanny> | undefined
   pending: Suspense | undefined
   cache: JSXNode[] | undefined;
}


function createDynamicConditionalKit(statementType: "if" | "elseIf" | "else", activationType: ActivationType | undefined, render: RenderFunction, context: ContextSnapshot, $condition: Ion<Booleanny>, pending: Suspense | undefined): DynamicConditionalRenderKit {
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes() // TODO:

   const commons = createCommonsNode([REGISTER_TRANSITION_NODE(registerTransitionNode)])
   return {
      pending,
      nodes: null,
      flask: undefined,
      statementType: statementType as 'if' | 'elseIf' | 'else',
      render: toAsyncRender(render, context, {
         [FLASK]: undefined,
         [COMMONS]: commons,
         [TRACE]: __DEV__ ? __DEV__buildAsyncPath() ?? '' : ''
      }),
      type: activationType,
      transitionNodes,
      $condition,
      cache: undefined
   }
}

export function toDynamicConditionalKits(kits: ConditionalKit[], activationType: ActivationType = 'create'): DynamicConditionalRenderKit[] {
   const context = $_snap_context()
   const dynamicKits = []
   for (const kit of kits) {
      if (!kit) continue;
      const { $condition, render, statementType, type = activationType, pending } = kit
      dynamicKits.push(createDynamicConditionalKit(statementType, type, render, context, $condition, pending))
   }
   return dynamicKits;
}

export class IfElseKit extends VineNode {
   private $activeIndex: Ion<number>

   constructor(
      private kits: DynamicConditionalRenderKit[],
      public outerFlask: Flask
   ) {
      super()

      this.$activeIndex = $ActiveIndex(getConditions(kits))


      this.activateConditional(this.kits[this.$activeIndex()], (kit) => {
         kit.flask!.emitInitialMount()
      })

      watchToRender(this.$activeIndex, ({ current: activeIndex, previous: prevIndex, flask }) => {
         if (activeIndex === prevIndex) return;
         console.log('switch conditional!', activeIndex, this.kits)
         const kit = this.kits[activeIndex]
         if (kit.pending) {
            if (!kit.cache) {
               // TODO: is there a better way of doing this?? Does this need to be wrapped in try{} finally{} ?
               const prevCount = getSuspenseCount(kit.pending)
               const output = processJSXOutput(kit.render(flask, kit.$condition))
               const count = getSuspenseCount(kit.pending)
               if (count > prevCount) {
                  console.warn('YES AWAITED!!!')
                  kit.cache = output
                  queueTask(() => {
                     const promise = kit.pending!()
                     if (promise) {
                        promise.then(() => {
                           swiftUpdate(() => {
                              this.switchConditional(activeIndex, prevIndex, flask)
                           })
                        })
                     }
                     else {
                        swiftUpdate(() => {
                           this.switchConditional(activeIndex, prevIndex, flask)
                        })
                     }
                  })
               }
               else {
                  console.warn('NOT AWAITED')
                  kit.cache = output
                  this.switchConditional(activeIndex, prevIndex, flask)
               }
            }
            else {
               const promise = kit.pending()
               if (promise) {
                  promise.then(() => {
                     swiftUpdate(() => {
                        this.switchConditional(activeIndex, prevIndex, flask)
                     })
                  })
               }
               else {
                  this.switchConditional(activeIndex, prevIndex, flask)
               }
            }
         }
         else {
            this.switchConditional(activeIndex, prevIndex, flask)
         }
      })
   }

   switchConditional(activeIndex: number, prevIndex: number, flask: Flask) {
      this.deactivateConditional(this.kits[prevIndex]);

      this.activateConditional(this.kits[activeIndex], (kit) => {
         setUpNodeVine(kit.nodes!, this.parent!, this.preceding)
         const fragment = new DocumentFragment()
         mountDOMNodes(kit.nodes!, fragment)
         queueInternalRender(() => {
            mountFragment(fragment, this.precedingLeaf, this.parent)
         }, flask)
         kit.type === 'create' ? kit.flask!.emitInitialMount() : kit.flask!.emitRemount()
      })

   }

   phasicNode?: TransitionNode | null | undefined;

   // activeType?: ActivationType

   activateConditional(kit: DynamicConditionalRenderKit | undefined, emitActivated: (kit: DynamicConditionalRenderKit) => void) {
      if (!kit) return;

      const flask = kit.flask ?? (kit.flask = this.outerFlask.spawn({ type: 'view', creationScope: kit.type === "create" }))
      kit.nodes = this.nodes =
         kit.pending && kit.cache ? kit.cache :
            kit.type === 'mount' ?
               (kit.cache ?? (kit.cache = processJSXOutput(kit.render(flask, kit.$condition))))
               : processJSXOutput(kit.render(flask, kit.$condition));

      emitActivated(kit)
   }

   deactivateConditional(kit: DynamicConditionalRenderKit | undefined) {
      if (!kit) return;
      const prevNodes = kit.nodes;
      if (!prevNodes) return;
      kit.nodes = null;

      if (kit.type === 'create') {
         kit.cache = undefined
         kit.flask!.emitDiscard()
         kit.flask = undefined
      }
      else kit.flask!.emitDemount()

      queueInternalRender(() => {
         removeDOMNodes(prevNodes)
      }, this.outerFlask)
      return kit;
   }
}




export type ConditionalStatement = {
   statementType: "if" | "elseIf" | "else";
   type: ActivationType | undefined;
   $condition: MaybeIon<Booleanny>
}

function getConditions(statements: ConditionalStatement[]) {
   const conditions: Ion<Booleanny>[] = []
   for (let i = 0; i < statements.length; i++) {
      const kit = statements[i]
      const $condition = kit.$condition
      if ($condition) {
         conditions.push($condition)
      }
      if (i === 0 && kit.statementType !== 'if' || i !== 0 && kit.statementType === 'if') {
         if (__DEV__) throw new Error('If must be the first child of a conditional series (or extraneous use of fragment/array)')
         else continue;
      }
      if (!('statementType' in kit)) {
         if (__DEV__) throw new Error("Conditional series can only contain conditional statements created by the If, ElseIf, and Else functions")
         else continue;
      }
      if (i !== statements.length - 1 && kit.statementType === 'else') {
         if (__DEV__) throw new Error("Else must be the very last statement of a conditional series");
         else continue;
      }
   }
   return conditions
}

function $ActiveIndex(conditions: Ion<Booleanny>[]) {
   return Ion(() => {
      for (let i = 0; i < conditions.length; i++) {
         const $condition = conditions[i]
         if ($condition()) {
            return i;
         }
      }
      return conditions.length;
   })
   // return () => {
   //    for (let i = 0; i < conditions.length; i++) {
   //       const $condition = conditions[i]
   //       if ($condition()) {
   //          return i;
   //       }
   //    }
   //    return conditions.length;
   // }
}





const showIfMap: WeakMap<DOMNode, string> = new WeakMap()

export function hideDOMNodes(nodes: JSXNode[]) {
   forEachNode(nodes, node => {
      if (node instanceof CharacterData) { // TextNode
         showIfMap.set(node, node.data)
         node.data = ""
      }
      else if (node instanceof HTMLElement || node instanceof SVGAElement || node instanceof MathMLElement) {
         showIfMap.set(node, node.style.display)
         node.style.display = 'none'
      }
      else if (__DEV__) {
         console.warn(`Unhandled node type ${node}`)
      }
   })
}

export function showDOMNodes(nodes: JSXNode[]) {
   forEachNode(nodes, node => {
      if (node instanceof CharacterData) {
         const text = showIfMap.get(node)
         if (text === undefined) throw new Error("previous text info missing")
         node.data = text;
      }
      else if (node instanceof HTMLElement || node instanceof SVGAElement || node instanceof MathMLElement) {
         const display = showIfMap.get(node)
         if (display === undefined) {
            node.style.removeProperty('display');
         }
         else {
            node.style.display = display
         }
      }
      else {
         console.warn(`Unhandled node type ${node}`)
      }
   })
}



export function renderShowHideSeries(kits: ConditionalKit[]) {
   const flask = getFlask()
   const $activeIndex = $ActiveIndex(getConditions(kits))
   const seriesNodes: RawJSXNode[] = []

   for (let i = 0; i < kits.length; i++) {
      const kit = kits[i]
      const nodes = processJSXOutput(kit.render(kit.$condition));
      if ($activeIndex() === i) {
         showDOMNodes(nodes)
      }
      else {
         hideDOMNodes(nodes)
      }

      seriesNodes.push(nodes)

      const $match = Ion(() => $activeIndex() === i)

      watchToRender($match, ({ current: isActive, previous: wasActive, flask }) => {
         if (isActive === wasActive) return;
         if ($match()) {
            queueInternalRender(() => {
               showDOMNodes(nodes)
            }, flask)
         }
         else if (wasActive) {
            queueInternalRender(() => {
               hideDOMNodes(nodes)
            }, flask)
         }
      })
   }

   return seriesNodes
}

export function Remount(input: FromTag<{
   'can:discard'?: () => void,
   Slot: RenderSlot

}>) {
   const { discard, Slot } = input;
   return markActivationType('mount', Slot, discard)
}

export function Create(input: FromTag<{
   Slot: RenderSlot

}>) {
   const { Slot } = input;
   return markActivationType('create', Slot)
}


type ActivationKit = {
   activationType: ActivationType;
   render: RenderFunction;
   discard: (() => void) | undefined;
}

export function markActivationType(activationType: ActivationType, render: RenderFunction, discard?: (() => void) | undefined) {
   return {
      activationType,
      render,
      discard
   }
}

export function isActivationKit(value: unknown): value is ActivationKit {
   return isPlainObject(value) && 'activationType' in value
}