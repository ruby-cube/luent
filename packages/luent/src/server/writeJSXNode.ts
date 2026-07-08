import { ComponentTag, InferSlot } from "../component/Component";
import { TagName } from "../element/makeElement";
import { ComponentConfig, ElementConfig, makeView, RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { writeComponent, writeElement, processJSXOutput } from "./writeHTML";
import { isFunction, normalizeToArray } from "@rue/utils";
import { writeShadowRoot } from "../component/shadow";
import { writeToPortal } from "./portals";
import { RenderSlot } from "../component/x-Input";
import { Context } from "../context/Context";


export function writeJSXNode(
  nodeType: SVGTag | TagName | ComponentTag | 'o-link' | 'o--body' | 'o--portal' | 'o:preserve' | 'shadow-root' | any,
  Slot: undefined | (() => RawJSXNode[]) | InferSlot,
  config: ElementConfig | ComponentConfig,
): RawJSXNode | void {

  switch (nodeType) {
    case 'o:context':
      return Context({ Slot, provide: config.provide } as any)

    case 'shadow-root':
      return writeShadowRoot(config)
    // TODO:
    case 'o-link':
      return writeToPortal('head',
        writeElement('link', undefined, <ElementConfig>config)
      );

    case 'o--body':
      // TODO: portal attributes
      if (Slot) return writeToPortal('body', writeSlot(Slot));

    case 'o--html':
      // TODO: portal attributes
      if (Slot) return writeToPortal('html', writeSlot(Slot));

    case 'o--head':
      return writeToPortal('head', writeSlot(Slot));

    case 'o--portal':
      console.error('writing o--portal as HTML string is not yet supported')
      return "";
    // return writeToPortal(config.to, Slot)

    case 'o:preserve':
      if (!Slot) throw new Error(`Extraneous <o:preserve>`)
      return makeView(Slot, config);

    default:
      if (typeof nodeType === 'string') {
        return writeElement(
          nodeType,
          Slot,
          <ElementConfig>config,
        )
      }
      return writeComponent(
        nodeType,
        <ComponentConfig>config,
      )
  }
}

function writeSlot(Slot: RenderSlot | undefined) {
  if (!Slot) return ""
  return processJSXOutput(normalizeToArray(Slot?.())).join('')
}