import { ComponentTag, InferSlot } from "../component/Component";
import { TagName } from "../element/makeElement";
import { ComponentConfig, ElementConfig, RawJSXNode } from "../node/makeJSXNode";
import { renderComponent, renderElement } from "./renderer";

export const jsxDEV = jsx;

export const jsxs = jsx;

export function jsx(nodeType: TagName | ComponentTag, config: { children: RenderSlot | RawJSXNode | AnyObject } & AnyObject) {
  let Slot = config.children;
  delete config.children
  config.Slot = Slot ?? (Slot = config.Slot);
  if (typeof Slot !== 'function' || undefined) throw new Error()
  if (nodeType === Context) {
    return Context({ Slot, provide: config.provide } as any)
  }
  if (nodeType === Fragment) {
    return normalizeToArray(Slot())
  }
  return writeJSXNode(
    nodeType,
    Slot as (() => RawJSXNode[]) | undefined,
    config
  );
}


export function writeJSXNode(
  nodeType: SVGTag | TagName | ComponentTag | 'o-link' | 'o--body' | 'o--portal' | 'remount-view' | 'show-view' | 'create-view' | any,
  Slot: undefined | (() => RawJSXNode[]) | InferSlot,
  config: ElementConfig | ComponentConfig,
): RawJSXNode | void {

  switch (nodeType) {
    // TODO:
    // case 'o-link':
    //   return Portal(config['portal-to'] ?? 'head', () =>
    //     renderElement('link', undefined, <ElementConfig>config)
    //   );

    // case 'o--body':
    //   return Portal('body', Slot);

    // case 'o--head':
    //   return Portal('body', Slot);

    // case 'o--portal':
    //   return Portal(config.to, Slot)
    // // deprecated??
    // case 'create-view':
    //   if (!Slot) throw new Error(`Extraneous <create-view>`)
    //   return makeView(wrapWithActivationType('create', Slot), config);

    // case 'show-view':
    //   if (!Slot) throw new Error(`Extraneous <show-view>`)
    //   return makeView(wrapWithActivationType('show', Slot), config);

    // case 'remount-view':
    //   if (!Slot) throw new Error(`Extraneous <remount-view>`)
    //   return makeView(wrapWithActivationType('remount', Slot), config);

    // case 'render-view':
    //   if (!Slot) throw new Error(`Extraneous <render-view>`)
    //   return makeView(Slot, config);

    default:
      if (typeof nodeType === 'string') {
        return renderElement(
          nodeType,
          Slot,
          <ElementConfig>config,
        )
      }
      return renderComponent(
        nodeType,
        <ComponentConfig>config,
      )
  }
}