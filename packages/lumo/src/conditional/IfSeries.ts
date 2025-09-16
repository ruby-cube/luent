import { $_run_with_, $_snap_context, ContextSnapshot, FLASK, Flask, getActiveFlask, getFlask } from "@rue/flask";
import { DOMNode, DOMParent, DynamicNodeKit, DynamicPodKit, forEachNode, JSXNode, mountDOMNodes, mountFragment, processJSXOutput, removeDOMNodes, setUpNodeVine, VineNode } from "../node/VineNode"
import { ActivationType } from "./If";
import { TransitionNode } from "../transition/TransitionNode";
import { ion, Ion } from "@rue/quarky";
import { Booleanny } from "@rue/types";
import { queueInternalRenderTask, watchToRender } from "../render-cycle";
import { RawJSXNode, RenderFunction, runWithGroupActivationReset } from "../node/makeJSXNode";
import { COMMONS, CommonsNode } from "../commons/commons-stack";
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
   flask: Flask | undefined;
   statementType: "if" | "elseIf" | "else";
   type: ActivationType | undefined;
   render: AsyncRenderConditional;
   // render: (flask: Flask, input?: Object) => RawJSXNode[];
   transitionNodes: TransitionNode[];
   $condition: Ion<Booleanny> | undefined
   cache: JSXNode[] | undefined;
}



function createDynamicConditionalKit(statementType: "if" | "elseIf" | "else", activationType: ActivationType | undefined, render: RenderFunction, context: ContextSnapshot, $condition?: Ion<Booleanny>): DynamicConditionalRenderKit {
   const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes() //TODO:

   const commons = createCommonsNode([REGISTER_TRANSITION_NODE(registerTransitionNode)])

   return {
      nodes: null,
      flask: undefined,
      statementType: statementType as 'if' | 'elseIf' | 'else',
      render: toAsyncRenderConditional(render, context, {
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

export function toDynamicConditionalKits(kits: ConditionalKit[], activationType: ActivationType = 'create'): DynamicConditionalRenderKit[] {
   const context = $_snap_context()
   const dynamicKits = []
   for (const kit of kits) {
      if (!kit) continue;
      const { $condition, render, statementType, type = activationType } = kit
      dynamicKits.push(createDynamicConditionalKit(statementType, type, render, context, $condition))
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

      this.activateConditional(this.kits[this.$activeIndex()], true)

      watchToRender(this.$activeIndex, ({ current: activeIndex, previous: prevIndex }) => {
         this.deactivateConditional(this.kits[prevIndex]);
         this.activateConditional(this.kits[activeIndex])
      })
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

   // showKitNodes: JSXNode[] | null = []

   // renderShowKits(kits: DynamicConditionalRenderKit[]) {
   //    let preceding = this.preceding
   //    for (let i = 0; i < kits.length; i++) {
   //       const kit = kits[i]
   //       if (kit.type !== 'show') continue;
   //       const nodes = kit.nodes = processJSXOutput(kit.render(this.outerFlask));
   //       if (i === 0) preceding = this.preceding = nodes.at(-1)
   //       else preceding = nodes.at(-1)
   //       hideDOMNodes(nodes)
   //       this.showKitNodes!.push(...nodes)
   //    }
   //    if (!this.showKitNodes!.length) this.showKitNodes = null;
   // }

   phasicNode?: TransitionNode | null | undefined;

   activeType?: ActivationType

   mount(root: DOMParent | DocumentFragment | null | undefined): void {
      if (!root) {
         if (__DEV__) console.error('root missing', root, this.nodes, this)
         return;
      }

      if (!this.nodes) return;

      mountDOMNodes(this.nodes, root)
   }

   unmount(nodes: JSXNode[]) {
      queueInternalRenderTask(() => {
         removeDOMNodes(nodes)
      })
   }

   activateConditional(kit: DynamicConditionalRenderKit | undefined, initialLoad: boolean = false) {
      if (!kit) return;
      const activeType = this.activeType = kit.type

      const flask = kit.flask ?? (kit.flask = this.outerFlask.spawn({ type: 'view', creationScope: activeType === "create" }))
      kit.nodes = this.nodes =
         activeType === 'remount' ?
            (kit.cache ?? (kit.cache = processJSXOutput(kit.render(flask))))
            : processJSXOutput(kit.render(flask));

      if (initialLoad) {
         queueInternalRenderTask(() => { //TODO: this needs to be called after app is mounted for initial mount...
            flask.emitInitialMount()
         })
      }
      else {
         setUpNodeVine(this.nodes, this.parent!, this.preceding)
         const fragment = new DocumentFragment()
         this.mount(fragment)
         queueInternalRenderTask(() => {
            mountFragment(fragment, this.precedingLeaf, this.parent)
            kit.type === 'create' ? flask.emitInitialMount() : flask.emitRemount()
         })
      }

   }

   deactivateConditional(kit: DynamicConditionalRenderKit | undefined) {
      if (!kit) return;
      const prevNodes = kit.nodes;
      if (!prevNodes) return;

      kit.nodes = null;

      if (kit.type === 'create') {
         kit.flask!.emitDiscard()
         kit.flask = undefined
      }
      else kit.flask!.emitDemount()
      this.unmount(prevNodes)
      return kit;
   }
}

export type AsyncRenderConditional = (flask: Flask, input?: Object) => RawJSXNode

export function toAsyncRenderConditional(render: RenderFunction, context: ContextSnapshot, nestedContext: { [FLASK]: Flask | undefined, [COMMONS]: CommonsNode, [TRACE]: string }): AsyncRenderConditional {
   return (flask: Flask, input?: Object) => {
      nestedContext[FLASK] = flask
      return $_run_with_(context, () => runWithGroupActivationReset(render, input), nestedContext)
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