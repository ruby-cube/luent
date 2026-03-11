import { Ion, isIon, isGetter, SuspenseIon, AsyncIon, SUSPENSE_QUARK, ASYNC_QUARK } from "../../../quarky/src";
import { Component, ComponentForge, InferSlot, makeComponent } from "../component/Component";
import { TagName, makeElement } from "../element/makeElement";
import { $Node, INTERNAL } from "./NodeRef";
import { AnyObject, Booleanny, Falsey } from "@rue/types";
import { Portal } from "../boundaries/Portal";
import { InnerHTMLKit } from "./InnerHTML";
import { Provided, callWithContext, createContextNode, wrapWithContext } from "../context/Context";
import { ShowHideType } from "../conditional/If";
import { MaybeIon, RenderSlot } from "../component/Input";
import { Create, markActivationType, Remount } from "../conditional/IfElse";
import { DOMNode, VineNode } from "./VineNode";
import { NodeRefsConfig } from "./NodeRefs";
import { normalizeToArray, toError } from "@rue/utils";
import { RenderError } from "../boundaries/Try";

export type TagType = ComponentForge | string

// export function Fragment() {
//    // for jsx-runtime
// }

// export function jsx(tag: any, config: any, ...children: any[]) { // TODO: transpiler should compile children to function
//    console.log("JSX!!!")
//    const _children = children.length === 1 && typeof children[0] === 'string' ? children as [string] : () => children
//    return makeJSXNode(tag, _children, config || {})
// }

declare global {
   function Slot<T>(input: { children?: RawJSXNode } & { provide?: Provided } & AnyObject): T
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


export type StyleInput = MaybeIon<string | Falsey> | MaybeIon<{ [key: string]: MaybeIon<string | number | Falsey> }>
// export type $Classes = Ion<ClassInput[]>
// export type ClassInput = MaybeIon<string | Falsey> | $Classes
export type ClassInput = MaybeIon<string | Falsey> | (MaybeIon<string | Falsey> | ClassInput)[]

export type ElementConfig<K extends TagName = TagName> = {
   [K in keyof HTMLElementEventMap as `on${K}`]?: (event: HTMLElementEventMap[K]) => void; } &
{
   // class?: ClassInput | ClassInput[],
   // style?: StyleInput | StyleInput[],
   'show-if'?: Ion<Booleanny>
   // attributes?: K extends TagName ? ((o: HTMLElementTagNameMap[K]) => void) | ((o: HTMLElementTagNameMap[K]) => void)[] : never,
} & NodeSetup<K>

// class?: string | undefined | ((o: DOMTokenList) => void) | (((o: DOMTokenList) => void) | string)[];
// style?: CSSProperties | undefined | ((o: CSSStyleDeclaration) => void) | (((o: CSSStyleDeclaration) => void) | string)[];
// attributes?: ((o: HTMLElementTagNameMap[K]) => void) | ((o: HTMLElementTagNameMap[K]) => void)[];

type NodesArray<T> = ReturnType<$Node<T>>[] | NodesArray<T>[]
type NodeSetup<T extends TagName | ComponentForge> = {
   ref?: $Node<T> | NodeRefsConfig,
   // provide?: Provided,
   class?: ClassInput | ClassInput[],
   style?: StyleInput | StyleInput[]
}
export type ComponentConfig<T extends ComponentForge = ComponentForge> =
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
   if (isIon(slot)) return function renderSlot() { return slot };
   if (slot instanceof Function) {
      return function renderSlot(...args: any[]) { return slot(...args) };
   }
   if (__DEV__) console.warn('jsx compiler failed to normalize slot to render function')
   return function renderSlot() { return slot };
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
   nodeType: SVGTag | TagName | ComponentForge | 'o--link' | 'remount-view' | 'show-view' | 'create-view' | any,
   Slot: undefined | (() => RawJSXNode[]) | InferSlot,
   config: ElementConfig | ComponentConfig,
): RawJSXNode | void {

   switch (nodeType) {

      case 'o--link':
         return Portal('head', () =>
            makeElement('link', undefined, <ElementConfig>config)
         );

      case 'o--body':
         return Portal('body', Slot);

      // deprecated??
      case 'create-view':
         if (!Slot) throw new Error(`Extraneous <create-view>`)
         return makeView(wrapWithActivationType('create', Slot), config);

      case 'show-view':
         if (!Slot) throw new Error(`Extraneous <show-view>`)
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


