import { Ion, isIon, isGetter, SuspenseIon, AsyncIon, SUSPENSE_QUARK, ASYNC_QUARK } from "@luent/quarky";
import { InferSlot, makeComponent } from "../component/Component";
import { TagName, setUpElement } from "../element/setUpElement";
import { NodeRef, INTERNAL } from "./NodeRef";
import { AnyObject, Booleanny, Falsey } from "@luent/types";
import { Portal } from "../boundaries/Portal";
import { InnerHTMLKit } from "./InnerHTML";
import { Context, Provided, callWithContext, createContextNode, wrapWithContext } from "../context/Context";
import { ViewType } from "../conditional/If";
import { MaybeIon, RenderTag } from "../component/bindings-types";
import { DOMNode, DOMParent, VineNode } from "./VineNode";
import { ComponentKit } from "@luent/nextscript";
import { createShadowRoot } from "../component/shadow";
import { provideTransition } from "../transitions/Transition";
import { fromContext } from "../context/provide";
import { ContextKey } from "../context/ContextKey";
import { createNSElement, getXMLNamespace, newXMLNamespace, withXMLNamespace } from "../element/NSElement";

export type TagType = RenderTag | string

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
  | DOMNode
  | string
  | Ion
  | VineNode
  | ComponentKit
  | InnerHTMLKit
  | null
  | undefined
  | JSX.Element

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



// export type $Classes = Ion<ClassInput[]>
// export type ClassInput = MaybeIon<string | Falsey> | $Classes

export type ElementConfig<K extends TagName = TagName> = {
  [K in keyof HTMLElementEventMap as `on${K}`]?: (event: HTMLElementEventMap[K]) => void; } &
{
  'display-if'?: Ion<Booleanny>
  // attributes?: K extends TagName ? ((o: HTMLElementTagNameMap[K]) => void) | ((o: HTMLElementTagNameMap[K]) => void)[] : never,
} & NodeSetup<K>

// class?: string | undefined | ((o: DOMTokenList) => void) | (((o: DOMTokenList) => void) | string)[];
// style?: CSSProperties | undefined | ((o: CSSStyleDeclaration) => void) | (((o: CSSStyleDeclaration) => void) | string)[];
// attributes?: ((o: HTMLElementTagNameMap[K]) => void) | ((o: HTMLElementTagNameMap[K]) => void)[];

type NodesArray<T> = ReturnType<NodeRef<T>>[] | NodesArray<T>[]
type NodeSetup<T extends TagName | RenderTag> = {
  // ref?: NodeRef<T> | NodeRefsConfig,
  // provide?: Provided,
  // class?: ClassInput | ClassInput[],
  // style?: StyleInput | StyleInput[]
}
export type ComponentConfig<T extends RenderTag = RenderTag> =
  T extends (props: infer P) => any ? P & NodeSetup<T> : T extends () => any ? NodeSetup<T> : never

export type GroupActivationType = ViewType | 'show'

let groupActivationType: GroupActivationType | undefined = undefined
let outerGroupActivationType: GroupActivationType | undefined = undefined

export function getGroupActivationType() {
  return groupActivationType
}

export function resetGroupActivationType() {
  groupActivationType = undefined
}



// export function runWithGroupActivationReset(render: RenderTag, input: Object | undefined) {
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


export function wrapWithActivationType(type: GroupActivationType, Slot: RenderTag) {
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

/**
 * normalizes the last argument of template functions to render function
 * @param lastArg 
 * @returns 
 */
export function normalizeToRenderFunction(lastArg: ((...args: any[]) => RawJSXNode) | RawJSXNode) {
  if (lastArg instanceof Function)
    return lastArg;
  return function render() { return lastArg };
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

export function makeView(Slot: RenderFunction, config: ViewConfig) {
  const { provide, await: awaited, meanwhile: renderPlaceholder, catch: renderError } = config
  Slot = provide ? wrapWithContext(Slot, provide) : Slot
  // Slot = awaited || renderPlaceholder ? wrapWithAwait(Slot, config) : renderError ? wrapWithTryCatch(Slot, renderError) : Slot
  // TODO: transitions
  return Slot()
}


export const HOST = ContextKey<Element>('?')

type SVGTag = keyof SVGElementTagNameMap

export function makeJSXNode(
  nodeType: SVGTag | TagName | RenderTag | 'o-link' | 'o--body' | 'o--portal' | 'o:preserve' | 'o:context' | 'o:transition' | any,
  Slot: undefined | (() => RawJSXNode[]) | InferSlot,
  config: ElementConfig | ComponentConfig,
): RawJSXNode | void {

  switch (nodeType) {
    case 'o:context':
      return Context({ Slot, provide: config.provide } as any)

    case 'o:transition':
      if (!Slot) return;
      return provideTransition(Slot, config)

    case 'shadow-root':
      return createShadowRoot(config)

    case 'o-link':
      return Portal('head', () =>
        setUpElement(useDOMNode('link').domNode, undefined, <ElementConfig>config)
      );

    case 'o--html':
      return Portal('html', Slot, config);

    case 'o--body':
      return Portal(document.body, Slot, config);

    case 'o--host':
      Portal(fromContext(HOST) ?? window, Slot, config);
      return null;

    case 'o--window':
      setUpElement(window, undefined, config)
      return null;

    case 'o--head':
      return Portal('head', Slot, config);

    case 'o--portal':
      const { to: target, ...rest } = config
      return Portal(target, Slot, rest)

    case 'o:preserve':
      if (!Slot) throw new Error(`Extraneous <o:preserve>`)
      return makeView(wrapWithActivationType('preserve', Slot), config);

    case undefined:
    case null:
      return;

    default:
      if (typeof nodeType === 'function') {
        return makeComponent(
          nodeType,
          <ComponentConfig>config,
        )
      }
      const { domNode, SlotWithXMLNS } = useDOMNode(nodeType, config.xmlns, Slot)

      if (SlotWithXMLNS && 'is-host' in config) {
        return setUpElement(
          domNode,
          wrapWithContext(SlotWithXMLNS, HOST(domNode)),
          <ElementConfig>config,
        )
      }
      return setUpElement(
        domNode,
        SlotWithXMLNS,
        <ElementConfig>config,
      )
  }
}

// TODO: xml namespace for existing elements
function useDOMNode(tag: string | Element, xmlns?: any, Slot?: RenderTag | undefined) {
  let newXML_NS: string | undefined;
  let XML_NS: string | undefined;

  const domNode = typeof tag === 'string' ? ((XML_NS = (newXML_NS = newXMLNamespace(tag, xmlns)) || getXMLNamespace())
    ? createNSElement(tag, XML_NS)
    : document.createElement(tag))
    : tag;

  return {
    domNode: domNode as Element & DOMParent & HTMLElement,
    SlotWithXMLNS: Slot ? withXMLNamespace(Slot, newXML_NS ? newXML_NS : tag === 'foreignObject' ? undefined : XML_NS) : Slot
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


