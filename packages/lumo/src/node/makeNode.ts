import { __devCheckIfTracked, __devCheckIfNotTracked, Ion, isIon } from "../../../quarky/src";
import { ComponentSetup, DOMNode, InternalComponent } from "../component/InternalComponent";
import { HTMLTag, makeElement } from "../element/makeElement";
import { InferSlot, makeComponent } from "../component/makeComponent";
import { NodeReferent, NodeRef, NodesRef } from "./NodeRef";
import { ConditionalRenderKit } from "../conditional/ConditionalRenderKit";
import { getCurrentIndex, ListRenderKit } from "../iteratives/ListRenderKit";
import { createCommons } from "../commons/Commons";
import { AnyObject, Booleanny } from "@rue/types";
import { createTransitionNode, TransitionNodeInput } from "../transition/TransitionNode";
import { MorphicRenderKit } from "../morphic/MorphicNode";
import { ConditionalRenderSeries } from "../conditional/ConditionalRenderSeries";
import { createTryNode, TryNodeInput } from "../boundaries/Try";
import { createSuspenseNode, SuspenseNodeInput } from "../boundaries/Suspense";
import { createPortalNode, PortalNodeInput } from "../boundaries/Portal";
import { InnerHTMLKit } from "./InnerHTML";
import { MaybeIon } from "../component/InputTypes";

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
   | InnerHTMLKit
   // | MutableKit




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

type Falsey = undefined | null | false
export type StyleInput = MaybeIon<string | Falsey> | MaybeIon<{ [key: string]: MaybeIon<string | number | Falsey> }>
export type ClassInput = MaybeIon<string | Falsey> | MaybeIon<{ [key: string]: MaybeIon<Booleanny> }>


export type ElementConfig<K extends HTMLTag = HTMLTag> = {
   [K in keyof HTMLElementEventMap as `on${K}`]?: (event: HTMLElementEventMap[K]) => void; } &
{
   class?: ClassInput | ClassInput[],
   style?: StyleInput | StyleInput[],
   // attributes?: K extends HTMLTag ? ((o: HTMLElementTagNameMap[K]) => void) | ((o: HTMLElementTagNameMap[K]) => void)[] : never,
} & NodeSetup<K>

// class?: string | undefined | ((o: DOMTokenList) => void) | (((o: DOMTokenList) => void) | string)[];
// style?: CSSProperties | undefined | ((o: CSSStyleDeclaration) => void) | (((o: CSSStyleDeclaration) => void) | string)[];
// attributes?: ((o: HTMLElementTagNameMap[K]) => void) | ((o: HTMLElementTagNameMap[K]) => void)[];

type NodeSetup<T extends HTMLTag | ComponentSetup> = {
   ref?: NodeRef<T> | NodesRef<T>,
}

export type ComponentConfig<T extends ComponentSetup = ComponentSetup> =
   T extends (props: infer P) => any ? P & NodeSetup<T> : T extends () => any ? NodeSetup<T> : never


export type SwapType = 'mount' | 'create' | 'show'

export class SwapConfig {
   constructor(
      public swap: SwapType
   ) { }
}

// TODO: how to distinguish render function from derived getter 
export function normalizeToRenderFunction(slot: ((...args: any[]) => NodeEntity) | NodeEntity) {
   if (slot instanceof Function && !isIon(slot)) { // distinguishes derivation functions from render functions
      return slot as (...args: any[]) => NodeEntity;
   }
   if (__DEV__) console.warn('jsx compiler failed to normalize slot to render function')
   return () => slot;
}

// function wrapWithContext(slot: Function) {
//    const outerContext = getCommons()
//    return () => {
//       pushCommons(outerContext)
//       try {
//          return slot()
//       } finally {
//          popCommons()
//       }
//    }
// }

type SVGTag = keyof SVGElementTagNameMap

export function makeNode(
   nodeType: SVGTag | HTMLTag | ComponentSetup | '$--transit' | '$--transition' | '$--commons' | 'vvv:mount' | 'vvv:create' | 'vvv:show' | '$--try' | '$--suspense' | '$--portal' | '$--link',
   Slot: undefined | (() => NodeEntity[]) | InferSlot,
   config: ElementConfig | ComponentConfig,
): DOMNode | InternalComponent | SwapConfig | JSX.Element | undefined {

   switch (nodeType) {
      case '$--commons':
         if (!Slot) throw new Error(`Extraneous <$--commons>`)
         return createCommons(Slot, <ComponentConfig>config)

      case '$--try':
         if (!Slot) throw new Error(`Extraneous <$--try>`)
         return createTryNode(Slot, <TryNodeInput>config)

      case '$--suspense':
         if (!Slot) throw new Error(`Extraneous <$--suspense>`)
         return createSuspenseNode(Slot, <SuspenseNodeInput>config)

      case '$--portal':
         if (!Slot) throw new Error(`Extraneous <$--portal>`)
         return createPortalNode(Slot, <PortalNodeInput>config)

      case '$--link':
         return createPortalNode(() =>
            makeElement(document.createElement('link'), undefined, <ElementConfig>config, undefined)
            , { to: 'head' })

      case 'vvv:show':
         return new SwapConfig('show')

      case 'vvv:mount':
         return new SwapConfig('mount')

      case 'vvv:create':
         return new SwapConfig('create')

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
//         if (isFunction(config)) {
//             const [item, $index] = getCurrentIndex();
//             const _config = config(item, $index!)
//             return _config
//         }
//         return config;
//     }
//     return undefined;
// }


