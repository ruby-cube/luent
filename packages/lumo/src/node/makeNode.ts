import { __devCheckIfTracked, __devCheckIfNotTracked, AtomicIon, Ion } from "../../../quarky/src";
import { ComponentSetup, DOMNode, InternalComponent } from "../component/InternalComponent";
import { HTMLTag, makeElement } from "../element/makeElement";
import { InferSlot, makeComponent } from "../component/makeComponent";
import { NodeReferent, NodeRef, NodesRef } from "./NodeRef";
import { getFlask, onFlaskDisposal } from "@rue/flask";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { getCurrentIndex, ListRenderKit } from "../iteratives/ListRenderKit";
import { createNodeContext } from "../context/Context";
import { AnyObject } from "@rue/types";
import { createTransitionNode, TransitionNodeInput } from "../transition/TransitionNode";
import { MorphicRenderKit } from "../morphic/MorphicNode";
import { ConditionalRenderSeries } from "../conditional/ConditionalRenderSeries";
import { createTryNode, TryNodeInput } from "../boundaries/Try";
import { createSuspenseNode, SuspenseNodeInput } from "../boundaries/Suspense";
import { createPortalNode, PortalNodeInput } from "../boundaries/Portal";
import { META } from "../../../quarky/src/ReactiveEntity";

// export function Fragment() {
//    // for jsx-runtime
// }

// export function jsx(tag: any, config: any, ...children: any[]) { //TODO: transpiler should compile children to function
//    console.log("JSX!!!")
//    const _children = children.length === 1 && typeof children[0] === 'string' ? children as [string] : () => children
//    return makeNode(tag, _children, config || {})
// }

export type NodeEntity =
   NodeEntity[]
   | JSX.Element
   | DOMNode
   | string
   | undefined
   | (() => any) // derived getter
   | Ion
   | InternalComponent
   | ListRenderKit
   | MorphicRenderKit
   | SwapConfig
   | ConditionalRenderKit
   | ConditionalRenderSeries

export type RenderFunction<Params = unknown> = Params extends any[] ?
   (...args: Params) => NodeEntity :
   () => NodeEntity

export type EventHandler<K extends keyof HTMLElementEventMap> = (event: HTMLElementEventMap[K]) => void

export type EventsConfig = {
   [K in keyof HTMLElementEventMap]?: EventHandler<K> | EventHandler<K>[]
}

// export type AssignedAttributes = {
//     events: { [key: string]: (EventListener | DerivedIon<EventListener | null>)[] };
//     classes: (((o: DOMTokenList) => void) | string)[],
//     styles: (((o: CSSStyleDeclaration) => void) | string)[],
//     other: { [key: string]: (any | DerivedIon<any>)[] }
// }

export type ElementConfig<K extends HTMLTag = HTMLTag> = {
   [K in keyof HTMLElementEventMap as `on${K}`]?: (event: HTMLElementEventMap[K]) => void; } &
{
   class?: string | ((o: DOMTokenList) => void) | (((o: DOMTokenList) => void) | string)[],
   style?: AnyObject/* TODO: limit to css properties */ | string | ((o: CSSStyleDeclaration) => void) | (((o: CSSStyleDeclaration) => void) | string)[],
   attributes?: K extends HTMLTag ? ((o: HTMLElementTagNameMap[K]) => void) | ((o: HTMLElementTagNameMap[K]) => void)[] : never,
} & NodeSetup<K>

type NodeSetup<T extends HTMLTag | ComponentSetup> = {
   ref?: NodeRef<T> | NodesRef<T>,
}

export type ComponentConfig<T extends ComponentSetup = ComponentSetup> =
   T extends (props: infer P) => any ? P & NodeSetup<T> : T extends () => any ? NodeSetup<T> : never


export type SwapType = 'mount' | 'instance' | 'display'

export class SwapConfig {
   constructor(
      public swap: SwapType
   ) { }
}

// TODO: how to distinguish render function from derived getter 
export function normalizeToRenderFunction(slot: ((...args: any[]) => NodeEntity) | NodeEntity) {
   if (slot instanceof Function && slot.name[0] !== '$') { // distinguishes derivation functions from render functions
      return slot as (...args: any[]) => NodeEntity;
   }
   if (__DEV__) console.warn('jsx compiler failed to normalize slot to render function')
      return () => slot;
}

export function makeNode(
   nodeType: HTMLTag | ComponentSetup | '$--transit' | '$--transition' | '$--context' | 'swap:mount' | 'swap:instance' | 'swap:display' | '$--try' | '$--suspense' | '$--portal',
   Slot: (() => NodeEntity[]) | InferSlot,
   config: ElementConfig | ComponentConfig,
): DOMNode | InternalComponent | SwapConfig | JSX.Element | undefined {

   switch (nodeType) {
      case '$--context':
         if (!Slot) throw new Error(`Extraneous <Context>`)
         return createNodeContext(Slot, <ComponentConfig>config)

      case '$--try':
         if (!Slot) throw new Error(`Extraneous <Context>`)
         return createTryNode(Slot, <TryNodeInput>config)

      case '$--suspense':
         if (!Slot) throw new Error(`Extraneous <Context>`)
         return createSuspenseNode(Slot, <SuspenseNodeInput>config)

      case '$--portal':
         if (!Slot) throw new Error(`Extraneous <Context>`)
         return createPortalNode(Slot, <PortalNodeInput>config)

      case 'swap:display':
         return new SwapConfig('display')

      case 'swap:mount':
         return new SwapConfig('mount')

      case 'swap:instance':
         return new SwapConfig('instance')

      case '$--transit':
      case '$--transition':
         if (!Slot) throw new Error(`Extraneous transition node`)
         return createTransitionNode(nodeType, Slot, <TransitionNodeInput>config)

      default:
         if (typeof nodeType === 'string') {
            return makeElement(
               nodeType,
               <[string] | (() => NodeEntity[])>Slot,
               <ElementConfig>config,
               getCurrentIndex()
            )
         }
         return makeComponent(
            nodeType,
            <InferSlot>Slot,
            <ComponentConfig>config,
            getCurrentIndex()
         )
   }
}

// export function _getNodeConfig(ref: NodeRef | undefined) {
//     if (ref) {
//         const config = getNodeConfig(ref);
//         if (config instanceof Function) {
//             const [item, $index] = getCurrentIndex();
//             const _config = config(item, $index!)
//             return _config
//         }
//         return config;
//     }
//     return undefined;
// }


