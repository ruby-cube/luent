import { __DEV__checkIfTracked, __DEV__checkIfNotTracked, Ion, isIon } from "../../../quarky/src";
import { Component, ComponentSetup, DOMNode } from "../component/Component";
import { HTMLTag, makeElement } from "../element/makeElement";
import { InferSlot, makeComponent } from "../component/makeComponent";
import {  $Node, $Nodes } from "./NodeRef";
import { getCurrentIndex, ListRenderKit } from "../iteratives/ListRenderKit";
import { AnyObject, Booleanny } from "@rue/types";
import { Portal, PortalKit, PortalNodeInput } from "../boundaries/Portal";
import { InnerHTMLKit } from "./InnerHTML";
import { MaybeIon } from "../component/Input";
import { Commons, Provided, callWithCommons } from "../commons/Commons";
import { ActivationType } from "../conditional/If";
import { FromTag, RenderSlot } from "../component/fromTag";
import { getClosestCommons } from "../commons/commons-stack";
import { PolymorphKit } from "../conditional/Polymorph";
import { DynamicKit } from "../dynamic/DynamicKit";

// export function Fragment() {
//    // for jsx-runtime
// }

// export function jsx(tag: any, config: any, ...children: any[]) { //TODO: transpiler should compile children to function
//    console.log("JSX!!!")
//    const _children = children.length === 1 && typeof children[0] === 'string' ? children as [string] : () => children
//    return makeNode(tag, _children, config || {})
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
   | DynamicKit
   | Component
   | InnerHTMLKit
   | undefined
   | PortalKit
// | MutableKit

export type JSXNode =
   | JSX.Element
   | DOMNode
   | string
   | Ion
   | DynamicKit
   | PortalKit




export type RenderFunction<Params = unknown> = (input?: Object) => RawJSXNode

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
   ref?: $Node<T> | $Nodes<T>,
   provide?: Provided
}

export type ComponentConfig<T extends ComponentSetup = ComponentSetup> =
   T extends (props: infer P) => any ? P & NodeSetup<T> : T extends () => any ? NodeSetup<T> : never


let groupActivationType: ActivationType | undefined = undefined
let outerGroupActivationType: ActivationType | undefined = undefined

export function getGroupActivationType() {
   return groupActivationType
}



export function withGroupActivationReset(Slot: RenderSlot) {
   outerGroupActivationType = groupActivationType
   groupActivationType = undefined;
   try {
      return Slot()
   }
   finally {
      groupActivationType = outerGroupActivationType;
      outerGroupActivationType = undefined
   }
}

export function wrapWithActivationType(type: ActivationType, Slot: RenderSlot, provide: Provided | undefined) {
   outerGroupActivationType = groupActivationType
   groupActivationType = type;
   try {
      if (provide)
         return callWithCommons(Slot, provide)
      return Slot()
   }
   finally {
      groupActivationType = outerGroupActivationType;
      outerGroupActivationType = undefined
   }
}

export function normalizeToRenderFunction(slot: ((...args: any[]) => JSXNode) | JSXNode) {
   if (isIon(slot)) return () => slot;
   if (slot instanceof Function) { // distinguishes derivation functions from render functions
      return slot as (...args: any[]) => JSXNode;
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
   nodeType: SVGTag | HTMLTag | ComponentSetup | 'o--link' | 'remount-demount' | 'show-hide',
   Slot: undefined | (() => JSXNode[]) | InferSlot,
   config: ElementConfig | ComponentConfig,
): DOMNode | Component | JSX.Element | undefined {

   switch (nodeType) {

      case 'o--link':
         return Portal('head', () =>
            makeElement('link', undefined, <ElementConfig>config, undefined)
         )

      case 'show-hide':
         if (!Slot) throw new Error(`Extraneous <show-hide>`)
         return wrapWithActivationType('show', Slot, config.provide)

      case 'remount-demount':
         if (!Slot) throw new Error(`Extraneous <remount-demount>`)
         return wrapWithActivationType('remount', Slot, config.provide)

      default:
         if (typeof nodeType === 'string') {
            return makeElement(
               nodeType,
               Slot,
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


