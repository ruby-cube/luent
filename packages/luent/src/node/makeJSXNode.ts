import { Ion, isIon, isGetter, SuspenseIon, AsyncIon, SUSPENSE_QUARK, ASYNC_QUARK } from "../../../quarky/src";
import { ComponentTag, InferSlot, makeComponent } from "../component/Component";
import { TagName, makeElement } from "../element/makeElement";
import { NodeRef, INTERNAL } from "./NodeRef";
import { AnyObject, Booleanny, Falsey } from "@rue/types";
import { Portal } from "../boundaries/Portal";
import { InnerHTMLKit } from "./InnerHTML";
import { Context, Provided, callWithContext, createContextNode, wrapWithContext } from "../context/Context";
import { ViewType } from "../conditional/If";
import { MaybeIon, RenderSlot } from "../component/x-Input";
import { Create, markActivationType, Remount } from "../conditional/IfElse";
import { DOMNode, VineNode } from "./VineNode";
import { NodeRefsConfig } from "./NodeRefs";
import { normalizeToArray, toError } from "@rue/utils";
import { RenderError } from "../boundaries/Try";
import { ComponentKit } from "@rue/nextscript";
import { createShadowRoot } from "../component/shadow";

export type TagType = ComponentTag | string

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
  'show-if'?: Ion<Booleanny>
  // attributes?: K extends TagName ? ((o: HTMLElementTagNameMap[K]) => void) | ((o: HTMLElementTagNameMap[K]) => void)[] : never,
} & NodeSetup<K>

// class?: string | undefined | ((o: DOMTokenList) => void) | (((o: DOMTokenList) => void) | string)[];
// style?: CSSProperties | undefined | ((o: CSSStyleDeclaration) => void) | (((o: CSSStyleDeclaration) => void) | string)[];
// attributes?: ((o: HTMLElementTagNameMap[K]) => void) | ((o: HTMLElementTagNameMap[K]) => void)[];

type NodesArray<T> = ReturnType<NodeRef<T>>[] | NodesArray<T>[]
type NodeSetup<T extends TagName | ComponentTag> = {
  // ref?: NodeRef<T> | NodeRefsConfig,
  // provide?: Provided,
  // class?: ClassInput | ClassInput[],
  // style?: StyleInput | StyleInput[]
}
export type ComponentConfig<T extends ComponentTag = ComponentTag> =
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




type SVGTag = keyof SVGElementTagNameMap

export function makeJSXNode(
  nodeType: SVGTag | TagName | ComponentTag | 'o-link' | 'o--body' | 'o--portal' | 'o:preserve' | 'o:context'  | 'o:transition'| any,
  Slot: undefined | (() => RawJSXNode[]) | InferSlot,
  config: ElementConfig | ComponentConfig,
): RawJSXNode | void {

  switch (nodeType) {
    case 'o:context':
      return Context({ Slot, provide: config.provide } as any)
      
    case 'shadow-root':
      return createShadowRoot(config)

    case 'o-link':
      return Portal('head', () =>
        makeElement('link', undefined, <ElementConfig>config)
      );

    case 'o--body':
      return Portal('body', Slot);

    case 'o--head':
      return Portal('head', Slot);

    case 'o--portal':
      return Portal(config.to, Slot)

    case 'o:preserve':
      if (!Slot) throw new Error(`Extraneous <o:preserve>`)
      return makeView(wrapWithActivationType('preserve', Slot), config);

    default:
      if (typeof nodeType === 'string') {
        return makeElement(
          nodeType,
          Slot,
          <ElementConfig>config,
        )
      }
      return makeComponent(
        nodeType,
        <ComponentConfig>config,
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


