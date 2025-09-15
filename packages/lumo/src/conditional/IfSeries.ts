import { $_snap_context, ContextSnapshot, FLASK, Flask, getFlask } from "@rue/flask";
import { DOMNode, DOMParent, DynamicNodeKit, DynamicPodKit, forEachNode, JSXNode, mountDOMNodes, mountFragment, removeDOMNodes, VineNode } from "../node/VineNode"
import { ActivationType } from "./If";
import { TransitionNode } from "../transition/TransitionNode";
import { ion, Ion } from "@rue/quarky";
import { Booleanny } from "@rue/types";
import { queueInternalRenderTask, watchToRender } from "../render-cycle";
import { RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { toAsyncRenderConditional } from "../node/DynamicKit";
import { COMMONS } from "../commons/commons-stack";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { FromTag, MaybeIon, RenderSlot } from "../component/Input";
import { createCommonsNode } from "../commons/Commons";
import { useTransitionNodes } from "../transition/TransitNode";
import { isObjectLiteral } from "@rue/utils";


export type ConditionalKit = {
   statementType: "if" | "elseIf" | "else";
   render: RenderFunction;
   type: ActivationType | undefined;
   $condition: MaybeIon<Booleanny>
   discard: (() => void) | undefined
}

export type DynamicConditionalRenderKit = {
   nodes: (JSXNode[]) | null
   prevShowStates: any[] | undefined
   flask: Flask | undefined;
   statementType: "if" | "elseIf" | "else";
   type: ActivationType | undefined;
   render: (flask: Flask, input?: Object) => RawJSXNode[];
   transitionNodes: TransitionNode[];
   $condition: Ion<Booleanny> | undefined
   cache: JSXNode[] | undefined;
}



function createDynamicConditionalKit(statementType: "if" | "elseIf" | "else", outerFlask: Flask, activationType: ActivationType | undefined, render: RenderFunction, context: ContextSnapshot, $condition?: Ion<Booleanny>): DynamicConditionalRenderKit {
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes() //TODO:

   const commons = createCommonsNode([REGISTER_TRANSITION_NODE(registerTransitionNode)])

   return {
      nodes: null,
      prevShowStates: undefined,
      flask: undefined,
      statementType: statementType as 'if' | 'elseIf' | 'else',
      render: toAsyncRenderConditional(render, outerFlask, context, {
         [FLASK]: undefined,
         [COMMONS]: commons,
         [TRACE]: __DEV__ ? __DEV__buildAsyncPath() : ''
      }),
      type: activationType,
      transitionNodes,
      $condition,
      cache: undefined
   }
}

export function toDynamicConditionalKits(kits: ConditionalKit[], flask: Flask, activationType: ActivationType = 'create'): DynamicConditionalRenderKit[] {
   const context = $_snap_context()
   const dynamicKits = []
   for (const kit of kits) {
      if (!kit) continue;
      const { $condition, render, statementType, type = activationType } = kit
      dynamicKits.push(createDynamicConditionalKit(statementType, flask, type, render, context, $condition))
   }
   return dynamicKits;
}




//TODO: render show kits as static with watchers




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

export function Remount(input: FromTag<{
   'can:discard'?: () => void,
   Slot: RenderSlot

}>) {
   const { discard, Slot } = input;
   return markActivationType('remount', Slot, discard)
}

export function Create(input: FromTag<{
   Slot: RenderSlot

}>) {
   const { Slot } = input;
   return markActivationType('create', Slot)
}

export function Show(input: FromTag<{
   Slot: RenderSlot

}>) {
   const { Slot } = input;
   return markActivationType('show', Slot)
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
   return isObjectLiteral(value) && 'activationType' in value
}



export class ConditionalSeriesKit extends VineNode implements DynamicPodKit, DynamicNodeKit {
   private $activeIndex: Ion<number>

   constructor(
      private kits: DynamicConditionalRenderKit[],
      public outerFlask: Flask
   ) {
      super()
      const conditions = this.getConditions(kits)

      this.$activeIndex = ion(() => {
         for (let i = 0; i < conditions.length; i++) {
            const $condition = conditions[i]
            if ($condition()) {
               return i;
            }
         }
         return conditions.length;
      })

      this.renderShowKits(kits)

      this.activateConditional(kits[this.$activeIndex()])

   }

   getConditions(statements: DynamicConditionalRenderKit[]) {
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

   showKitNodes: JSXNode[] | null = []

   renderShowKits(kits: DynamicConditionalRenderKit[]) {
      for (let i = 0; i < kits.length; i++) {
         const kit = kits[i]
         if (kit.type !== 'show') continue;
         const nodes = kit.nodes = kit.render(this.outerFlask);
         hideDOMNodes(nodes)
         this.showKitNodes!.push(...nodes)
      }
      if (!this.showKitNodes!.length) this.showKitNodes = null;
   }

   phasicNode?: TransitionNode | null | undefined;

   setUp() {
      watchToRender(this.$activeIndex, ({ current: activeIndex, previous: prevIndex }) => {
         this.deactivateConditional(this.kits[prevIndex]);
         this.activateConditional(this.kits[activeIndex])
      })
   }

   mount(nodes: JSXNode[], root: DOMParent | DocumentFragment | null | undefined): void {
      if (!root) {
         if (__DEV__) console.error('root missing')
         return;
      }
      if (this.showKitNodes) {
         mountDOMNodes(nodes, root)
         const firstNode = nodes[0]
         if (firstNode instanceof VineNode) {
            firstNode.preceding = this.preceding;
         }
         this.preceding = nodes.at(-1)
         this.showKitNodes = null
      }

      mountDOMNodes(nodes, root)

      if (root instanceof DocumentFragment) {
         queueInternalRenderTask(() => {
            mountFragment(root, this.precedingLeaf, this.parent)
         }, this.outerFlask)
      }
   }

   unmount(nodes: JSXNode[]) {
      queueInternalRenderTask(() => {
         removeDOMNodes(nodes)
      }, this.outerFlask)
   }

   activateConditional(kit: DynamicConditionalRenderKit, fragment?: DocumentFragment) {
      if (kit.type === 'show') {
         if (!kit.nodes) return;
         showDOMNodes(kit.nodes)
         return;
      }
      const flask = kit.flask ?? (kit.flask = this.outerFlask.spawn({ type: 'view', creationScope: kit.type === "create" }))
      kit.nodes = this.nodes = kit.type === 'remount' ? (kit.cache ?? (kit.cache = kit.render(flask))) : kit.render(flask);
      this.mount(kit.nodes, fragment ?? this.parent)

      queueInternalRenderTask(() => { //TODO: this needs to be called after app is mounted for initial mount...
         flask.emitInitialMount()
      }, this.outerFlask)
   }

   deactivateConditional(kit: DynamicConditionalRenderKit) {
      const prevNodes = kit.nodes;
      if (!prevNodes) return;
      if (kit.type === 'show') {
         hideDOMNodes(prevNodes)
         return;
      }
      kit.nodes = null;
      kit.flask!.emitDiscard()
      this.unmount(prevNodes)
      return kit;
   }
}




// function makeList() {

//    const nodes = this.nodes = []
//    for (const item of list) {
//       nodes.push(makeListItem(item, index, render))
//    }

//    return {

//       setUp() {
//          watchToRender(){

//          }
//       },
//       mount() {
//          const nodes = this.nodes;
//          for (const item of nodes) {
//             item.mount()
//          }
//       }
//    }
// }

// function makeListItem() {

//    return {
//       setUp() {
//          const nodeEntities = this.nodeEntities = render()
//       },
//       mount,
//       unmount
//    }
// }