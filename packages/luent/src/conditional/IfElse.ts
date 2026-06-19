import { $_run_with_, $_snap_context, ContextSnapshot, FLASK, Flask, getActiveFlask, getFlask } from "@rue/flask";
import { AsyncRender, DOMNode, forEachNode, JSXNode, mountDOMNodes, mountFragment, processJSXOutput, removeDOMNodes, setUpNodeVine, toAsyncRender, VineNode } from "../node/VineNode"
import { ViewType, If } from "./If";
import {  createMemoizedDerivation, getSuspenseCount, Ion, PRELUDE, atRender, queueTask, SuspenseIon, watch, watchToRender } from "@rue/quarky";
import { Booleanny } from "@rue/types";
import { RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { FromTag, MaybeIon, RenderSlot } from "../component/x-Input";
import { isPlainObject } from "@rue/utils";
import { unmarkInitialRender, markInitialRender, TransitionConfigs } from "../transitions/transitions";
import { setTransition } from "../transitions/Transition";


export type ConditionalKit = {
   statementType: "if" | "elseIf" | "else";
   render: RenderFunction;
   type: ViewType | undefined;
   $condition: MaybeIon<Booleanny>
   pending: SuspenseIon | undefined
   // discard: (() => void) | undefined
}


export type DynamicNodeKit = {
   // cache
   // nodes
   // pending
   // type
   // render
   // view
   // flask
   nodes: (JSXNode[]) | null
   cache: JSXNode[] | undefined;
   awaitCache: RawJSXNode;
   pending: SuspenseIon | undefined
   flask: Flask | undefined;
   type: ViewType | undefined;
   render: AsyncRender;
   view: { markDiscard: () => void }
}



export type DynamicConditionalRenderKit = {
   // discard: (() => void) | undefined
   statementType: "if" | "elseIf" | "else";
   // transitionNodes: TransitionNode[];
   $condition: Ion<Booleanny> | undefined
} & DynamicNodeKit


function createDynamicConditionalKit(statementType: "if" | "elseIf" | "else", viewType: ViewType | undefined, render: RenderFunction, context: ContextSnapshot, $condition: Ion<Booleanny>, pending: SuspenseIon | undefined, transitions: TransitionConfigs | undefined): DynamicConditionalRenderKit {
   // const { REGISTER_TRANSITION_NODE, registerTransitionNode, transitionNodes } = useTransitionNodes() // TODO:

   // const context = createContextNode([REGISTER_TRANSITION_NODE(registerTransitionNode)])

   let _cache: JSXNode[] | undefined = undefined

   return {
      pending,
      nodes: null,
      flask: undefined,
      statementType: statementType as 'if' | 'elseIf' | 'else',
      render: toAsyncRender((...args: any[]) => {
         try {
            setTransition(transitions)
            return render(...args)
         }
         finally {
            setTransition(undefined)
         }
      }, context, {
         [FLASK]: undefined,
         // [CONTEXT]: context,
         [TRACE]: __DEV__ ? __DEV__buildAsyncPath() ?? '' : ''
      }),
      type: viewType,
      // transitionNodes,
      $condition,
      get cache(): JSXNode[] | undefined {
         return _cache
      },
      set cache(nodes: JSXNode[]) {
         _cache = nodes
      },
      view: {
         markDiscard() {
            console.log('@$@ marking discard')
            _cache = undefined
         }
      }
   }
}

export function toDynamicConditionalKits(kits: ConditionalKit[], viewType: ViewType = 'create', transitions: TransitionConfigs | undefined): DynamicConditionalRenderKit[] {
   const context = $_snap_context()
   const dynamicKits = []
   for (const kit of kits) {
      if (!kit) continue;
      const { $condition, render, statementType, type = viewType, pending } = kit
      dynamicKits.push(createDynamicConditionalKit(statementType, type, render, context, $condition, pending, transitions))
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

      try {
         markInitialRender(true)
         this.activateConditional(this.kits[this.$activeIndex()], (kit) => {
            kit.flask!.emitInitialMount()
         })
      }
      finally {
         unmarkInitialRender()
         watchToRender(this.$activeIndex, ({ previous: prevIndex }) => {
            console.log('@@@ index changed!', this.$activeIndex(), prevIndex)
            if (this.$activeIndex() === prevIndex) return;
            const kit = this.kits[this.$activeIndex()]
            const prevKit = this.pendingDeactivatedKit ?? this.kits[prevIndex]
   
            console.log('switch?')
            if (this.pendingSwitch) {
               console.log('>>> CANCEL PROMISE')
               this.cancelledPendingSwitch.add(this.pendingSwitch)
               this.pendingSwitch = null
            }
   
            if (kit.pending) {
               console.log('await pending switch')
               this.awaitPendingConditional(kit.pending, kit, prevKit)
            }
            else {
               console.log('@@@ switch!')
               this.deactivateConditional(prevKit);
               this.reactivateConditional(kit)
            }
         })
      }
   }

   cancelledPendingSwitch = new Set()

   _pendingSwitchID = 0
   pendingSwitch: number | null = null;
   pendingDeactivatedKit: DynamicNodeKit | null | undefined = null

   awaitPendingConditional(suspense: SuspenseIon, kit: DynamicNodeKit, prevKit: DynamicNodeKit | undefined) {
      if (!kit.cache) {
         const prevCount = getSuspenseCount(suspense)
         kit.flask = this.outerFlask.spawn({ type: 'view', creationScope: kit.type === 'create' })
         const rawOutput = kit.render(kit.flask, kit.view)
         const count = getSuspenseCount(suspense)
         if (count > prevCount) {
            kit.awaitCache = rawOutput
            const promise = suspense()
            if (promise) {
               console.log('### B promise...', prevKit && prevKit.nodes ? [...prevKit.nodes] : prevKit.nodes)
               const id = this.pendingSwitch = ++this._pendingSwitchID
               this.pendingDeactivatedKit = prevKit
               promise.then(() => {
                  if (this.cancelledPendingSwitch.has(id)) {
                     console.log('>>> (canceled) B')
                     this.cancelledPendingSwitch.delete(id)
                     return;
                  }
                  this.pendingSwitch = null
                  console.log('### B promise switch')
                  if (prevKit !== kit)
                     this.deactivateConditional(prevKit);
                  this.reactivateConditional(kit)
               })
            }
            else {
               watch(suspense, ({ current: promise }) => {
                  if (promise) {
                     console.log('### A promise...', prevKit && prevKit.nodes ? [...prevKit.nodes] : prevKit.nodes)
                     const id = this.pendingSwitch = ++this._pendingSwitchID
                     this.pendingDeactivatedKit = prevKit
                     promise.then(() => {
                        if (this.cancelledPendingSwitch.has(id)) {
                           console.log('>>> (canceled) A')
                           this.cancelledPendingSwitch.delete(id)
                           return;
                        }
                        this.pendingSwitch = null
                        console.log('### A promise switch')
                        if (prevKit !== kit)
                           this.deactivateConditional(prevKit);
                        this.reactivateConditional(kit)
                     })
                  }
               }, { phase: PRELUDE, once: true })
            }
         }
         else {
            // TODO: end suspense... need a way to do this without exposing .value to devs
            suspense.value = null
            console.log('### C switch')
            kit.awaitCache = rawOutput
            if (prevKit !== kit)
               this.deactivateConditional(prevKit);
            this.reactivateConditional(kit)
         }
      }
      else {
         const promise = suspense()
         if (promise) {
            console.log('### D promise...')
            const id = this.pendingSwitch = ++this._pendingSwitchID
            this.pendingDeactivatedKit = prevKit

            promise.then(() => {
               if (this.cancelledPendingSwitch.has(id)) {
                  console.log('>>> (canceled) D')
                  this.cancelledPendingSwitch.delete(id)
                  return;
               }
               this.pendingSwitch = null
               console.log('### D promise switch', prevKit === kit)
               if (prevKit !== kit)
                  this.deactivateConditional(prevKit);
               this.reactivateConditional(kit)
            })
         }
         else {
            console.log('### E switch')
            if (prevKit !== kit)
               this.deactivateConditional(prevKit);
            this.reactivateConditional(kit)
         }
      }
   }

   reactivateConditional(activeKit: DynamicNodeKit) {
      this.activateConditional(activeKit, (kit, initial) => {
         setUpNodeVine(kit.nodes!, this.parent!, this.preceding)
         const fragment = new DocumentFragment()
         mountDOMNodes(kit.nodes!, fragment)
         atRender(() => {
            mountFragment(fragment, this.precedingLeaf, this.parent)
         })
         initial ? kit.flask!.emitInitialMount() : kit.flask!.emitRemount()
      })
   }

   activateConditional(kit: DynamicNodeKit | undefined, emitActivated: (kit: DynamicNodeKit, initial: boolean) => void) {
      if (!kit) return;
      const initialMount = !kit.cache
      const flask = kit.flask ?? (kit.flask = this.outerFlask.spawn({ type: 'view', creationScope: kit.type === "create" }))
      kit.nodes = this.nodes =
         kit.type === 'preserve' ?
            (kit.cache ?? (kit.cache = processJSXOutput(kit.awaitCache ? kit.awaitCache : kit.render(flask, kit.view)))) // TODO: remove kit.view as input?
            : processJSXOutput(kit.awaitCache ? kit.awaitCache : kit.render(flask, kit.view));
      kit.awaitCache = undefined
      emitActivated(kit, initialMount)
   }

   deactivateConditional(kit: DynamicNodeKit | undefined) {
      if (!kit) return;
      const prevNodes = kit.nodes;
      this.pendingDeactivatedKit = null
      if (!prevNodes) return;
      kit.nodes = null;
      
      if (!kit.cache) {
         // kit.awaitCache = undefined
         kit.flask!.emitDiscard()
         kit.flask = undefined
      }
      else {
         kit.flask!.emitDemount()
      }
      
      atRender(() => {
         removeDOMNodes(prevNodes)
      })
      return kit;
   }
}




export type ConditionalStatement = {
   statementType: "if" | "elseIf" | "else";
   type: ViewType | undefined;
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
   return createMemoizedDerivation(() => {
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

      const $match = createMemoizedDerivation(() => $activeIndex() === i)

      watchToRender($match, ({ current: isActive, previous: wasActive, flask }) => {
         if (isActive === wasActive) return;
         if ($match()) {
            atRender(() => {
               showDOMNodes(nodes)
            })
         }
         else if (wasActive) {
            atRender(() => {
               hideDOMNodes(nodes)
            })
         }
      })
   }

   return seriesNodes
}

export function Remount(input: {
   discard: DiscardSignal,
   Slot: RenderSlot

}) {
   const { discard, Slot } = input;
   return markActivationType('preserve', Slot, discard)
}

export function Create(input: {
   Slot: RenderSlot

}) {
   const { Slot } = input;
   return markActivationType('create', Slot)
}

type DiscardSignal = (destroy: () => void) => void

type ActivationKit = {
   viewType: ViewType;
   render: RenderFunction;
   discard: DiscardSignal | undefined;
}

export function markActivationType(viewType: ViewType, render: RenderFunction, discard?: DiscardSignal | undefined) {
   return {
      viewType,
      render,
      discard
   }
}

export function isActivationKit(value: unknown): value is ActivationKit {
   return isPlainObject(value) && 'viewType' in value
}