import { Ion, isIon, isGetter, SuspenseIon, AsyncIon, SUSPENSE_QUARK, ASYNC_QUARK } from "../../../quarky/src";
import { Component, ComponentSetup, InferSlot, makeComponent } from "../component/Component";
import { HTMLTag, makeElement } from "../element/makeElement";
import { $Node, INTERNAL } from "./NodeRef";
import { AnyObject, Booleanny } from "@rue/types";
import { Portal } from "../boundaries/Portal";
import { InnerHTMLKit } from "./InnerHTML";
import { Provided, callWithCommons, createCommonsNode } from "../context/Context";
import { ShowHideType } from "../conditional/If";
import { MaybeIon, RenderSlot } from "../component/Input";
import { Create, markActivationType, Remount } from "../conditional/IfElse";
import { DOMNode, VineNode } from "./VineNode";
import { $Index } from "../iteratives/ItemList";
import { NodeRefsConfig } from "./NodeRefs";
import { normalizeToArray, toError } from "@rue/utils";
import { _ } from "vitest/dist/chunks/reporters.d.BFLkQcL6";
import { RenderError } from "../boundaries/Try";
import { LumoHooks } from "../flask/template-hooks";

// export function Fragment() {
//    // for jsx-runtime
// }

// export function jsx(tag: any, config: any, ...children: any[]) { // TODO: transpiler should compile children to function
//    console.log("JSX!!!")
//    const _children = children.length === 1 && typeof children[0] === 'string' ? children as [string] : () => children
//    return makeJSXNode(tag, _children, config || {})
// }

declare global {
   function Slot<T>(input: { children: RawJSXNode } & { provide?: Provided } & AnyObject): T
}

export type RawJSXNode =
   RawJSXNode[]
   | JSX.Element
   | DOMNode
   | string
   | Ion
   | VineNode
   | Component
   | InnerHTMLKit
   | null
   | undefined
// | MutableKit

// export type JSXNode =
//    | JSX.Element
//    | DOMNode
//    | string
//    | Ion
//    | DynamicKit
//    | PortalKit




export type RenderFunction<Params = unknown> = (input?: any) => RawJSXNode

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
   'display-if'?: Ion<Booleanny>
   // attributes?: K extends HTMLTag ? ((o: HTMLElementTagNameMap[K]) => void) | ((o: HTMLElementTagNameMap[K]) => void)[] : never,
} & NodeSetup<K>

// class?: string | undefined | ((o: DOMTokenList) => void) | (((o: DOMTokenList) => void) | string)[];
// style?: CSSProperties | undefined | ((o: CSSStyleDeclaration) => void) | (((o: CSSStyleDeclaration) => void) | string)[];
// attributes?: ((o: HTMLElementTagNameMap[K]) => void) | ((o: HTMLElementTagNameMap[K]) => void)[];

type NodesArray<T> = ReturnType<$Node<T>>[] | NodesArray<T>[]
type NodeSetup<T extends HTMLTag | ComponentSetup> = {
   ref?: $Node<T> | NodeRefsConfig,
   provide?: Provided
}
export type ComponentConfig<T extends ComponentSetup = ComponentSetup> =
   T extends (props: infer P) => any ? P & NodeSetup<T> : T extends () => any ? NodeSetup<T> : never

export type GroupActivationType = ShowHideType | 'show'

let groupActivationType: GroupActivationType | undefined = undefined
let outerGroupActivationType: GroupActivationType | undefined = undefined

export function getGroupActivationType() {
   return groupActivationType
}

export function resetGroupActivationType() {
   groupActivationType = undefined
}



// export function runWithGroupActivationReset(render: RenderSlot, input: Object | undefined) {
//    outerGroupActivationType = groupActivationType
//    groupActivationType = undefined;
//    try {
//       return render(input)
//    }
//    finally {
//       groupActivationType = outerGroupActivationType;
//       outerGroupActivationType = undefined
//    }
// }

export function wrapWithContext(Slot: RenderSlot, provide: Provided) {
   return () => callWithCommons(Slot, createCommonsNode(provide))
}

export function wrapWithActivationType(type: GroupActivationType, Slot: RenderSlot) {
   return () => {
      outerGroupActivationType = groupActivationType
      groupActivationType = type;
      try {
         return Slot()
      }
      finally {
         groupActivationType = outerGroupActivationType;
         outerGroupActivationType = undefined
      }
   }
}

export function normalizeToRenderFunction(slot: ((...args: any[]) => RawJSXNode) | RawJSXNode) {
   if (isIon(slot)) return () => slot;
   if (slot instanceof Function) {
      return slot as (...args: any[]) => RawJSXNode;
   }
   if ( __DEV__) console.warn('jsx compiler failed to normalize slot to render function')
   return () => slot;
}

export type ViewConfig = AwaitConfig & ContextConfig



type CatchConfig = {
   catch?: (error: Error) => RawJSXNode
}

type ContextConfig = {
   provide?: Provided,
}

type TransitionConfig = {
   'transition-in'?: any // TODO:
   'transition-out'?: any // TODO:
}

function makeView(Slot: RenderFunction, config: ViewConfig) {
   const { provide, await: awaited, meanwhile: renderPlaceholder, catch: renderError } = config
   Slot = provide ? wrapWithContext(Slot, provide) : Slot
   // Slot = awaited || renderPlaceholder ? wrapWithAwait(Slot, config) : renderError ? wrapWithTryCatch(Slot, renderError) : Slot
   // TODO: transitions
   return Slot()
}


function wrapWithTryCatch(Slot: RenderFunction, renderError: RenderError) {
   return () => {
      try {
         return Slot()
      }
      catch (error) {
         return renderError(toError(error))
      }
   }
}

type SVGTag = keyof SVGElementTagNameMap

export function makeJSXNode(
   nodeType: SVGTag | HTMLTag | ComponentSetup | 'o--link' | 'remount-view' | 'display-view' | 'create-view' | any,
   Slot: undefined | (() => RawJSXNode[]) | InferSlot,
   config: ElementConfig | ComponentConfig,
): RawJSXNode | void {

   switch (nodeType) {

      case 'o--link':
         return Portal('head', () =>
            makeElement('link', undefined, <ElementConfig>config)
         );

      case 'create-view':
         if (!Slot) throw new Error(`Extraneous <create-view>`)
         return makeView(wrapWithActivationType('create', Slot), config);

      case 'display-view':
         if (!Slot) throw new Error(`Extraneous <display-view>`)
         return makeView(wrapWithActivationType('show', Slot), config);

      case 'remount-view':
         if (!Slot) throw new Error(`Extraneous <remount-view>`)
         return makeView(wrapWithActivationType('remount', Slot), config);

      case 'render-view':
         if (!Slot) throw new Error(`Extraneous <render-view>`)
         return makeView(Slot, config);

      default:
         if (typeof nodeType === 'string') {
            return makeElement(
               nodeType,
               Slot,
               <ElementConfig>config,
               // getCurrentIndex()
            )
         }
         return makeComponent(
            nodeType,
            <InferSlot>Slot,
            <ComponentConfig>config,
            // getCurrentIndex()
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


