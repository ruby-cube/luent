import { __DEV__checkIfTracked, __DEV__checkIfNotTracked, Ion, isIon, isGetter } from "../../../quarky/src";
import { Component, ComponentSetup, InferSlot, makeComponent } from "../component/Component";
import { HTMLTag, makeElement } from "../element/makeElement";
import { $Node, $Nodes } from "./NodeRef";
import { getCurrentIndex } from "../iteratives/ListRenderKit";
import { AnyObject, Booleanny } from "@rue/types";
import { Portal } from "../boundaries/Portal";
import { InnerHTMLKit } from "./InnerHTML";
import { Provided, callWithCommons, createCommonsNode } from "../commons/Commons";
import { ActivationType } from "../conditional/If";
import { MaybeIon, RenderSlot } from "../component/Input";
import { Create, markActivationType, Remount } from "../conditional/IfElse";
import { DOMNode, VineNode } from "./VineNode";

// export function Fragment() {
//    // for jsx-runtime
// }

// export function jsx(tag: any, config: any, ...children: any[]) { //TODO: transpiler should compile children to function
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
   'show-if'?: Ion<Booleanny>
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

   type GroupActivationType = ActivationType | 'show'

let groupActivationType: GroupActivationType | undefined = undefined
let outerGroupActivationType: GroupActivationType | undefined = undefined

export function getGroupActivationType() {
   return groupActivationType
}

export function resetGroupActivationType(){
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

export function callWithActivationType(type: GroupActivationType, Slot: RenderSlot, provide: Provided | undefined) {
   outerGroupActivationType = groupActivationType
   groupActivationType = type;
   try {
      if (provide)
         return callWithCommons(Slot, createCommonsNode(provide))
      return Slot()
   }
   finally {
      groupActivationType = outerGroupActivationType;
      outerGroupActivationType = undefined
   }
}

export function normalizeToRenderFunction(slot: ((...args: any[]) => RawJSXNode) | RawJSXNode) {
   if (isIon(slot)) return () => slot;
   if (slot instanceof Function) { // distinguishes derivation functions from render functions
      return slot as (...args: any[]) => RawJSXNode;
   }
   if (__DEV__) console.warn('jsx compiler failed to normalize slot to render function')
   return () => slot;
}



type SVGTag = keyof SVGElementTagNameMap

export function makeJSXNode(
   nodeType: SVGTag | HTMLTag | ComponentSetup | 'o--link' | 'mount-remount' | 'show-hide' | any,
   Slot: undefined | (() => RawJSXNode[]) | InferSlot,
   config: ElementConfig | ComponentConfig,
): RawJSXNode | void {

   switch (nodeType) {

      case 'o--link':
         return Portal('head', () =>
            makeElement('link', undefined, <ElementConfig>config, undefined)
         );

      case 'show-hide':
         if (!Slot) throw new Error(`Extraneous <show-hide>`)
         return callWithActivationType('show', Slot, config.provide);

      case 'mount-remount':
         if (!Slot) throw new Error(`Extraneous <mount-remount>`)
         return callWithActivationType('remount', Slot, config.provide);

      case Create:
         if (!Slot) throw new Error(`<Create> must have children`)
         return markActivationType('create', Slot);

      case Remount:
         if (!Slot) throw new Error(`<Remount> must have children`)
         return markActivationType('remount', Slot, 'discard' in config ? config.discard : undefined);
      
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


