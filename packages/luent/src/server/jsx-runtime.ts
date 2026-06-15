import { AnyObject } from "@rue/types";
import { ComponentTag, InferSlot } from "../component/Component";
import { RenderSlot } from "../component/x-Input";
import { TagName } from "../element/makeElement";
import { ComponentConfig, ElementConfig, makeView, RawJSXNode, RenderFunction } from "../node/makeJSXNode";
import { writeComponent, writeElement } from "./writeHTML";
import { Context } from "../context/Context";
import { isFunction } from "@rue/utils";

// export const jsxDEV = jsx;

// export const jsxs = jsx;

// export function jsx(nodeType: TagName | ComponentTag, config: { children: RenderSlot | RawJSXNode | AnyObject } & AnyObject) {
//   let Slot = config.children;
//   delete config.children
//   config.Slot = Slot ?? (Slot = config.Slot);
//   if (typeof Slot !== 'function' || undefined) throw new Error()
//   if (nodeType === Context) {
//     return Context({ Slot, provide: config.provide } as any)
//   }
//   if (nodeType === Fragment) {
//     return normalizeToArray(Slot())
//   }
//   return writeJSXNode(
//     nodeType,
//     Slot as (() => RawJSXNode[]) | undefined,
//     config
//   );
// }


export function writeJSXNode(
  nodeType: SVGTag | TagName | ComponentTag | 'o-link' | 'o--body' | 'o--portal' | 'remount-view' | 'show-view' | 'create-view' | any,
  Slot: undefined | (() => RawJSXNode[]) | InferSlot,
  config: ElementConfig | ComponentConfig,
): RawJSXNode | void {

  switch (nodeType) {
    // TODO:
    case 'o-link':
      return Portal(config['portal-to'] ?? 'head', () =>
        writeElement('link', undefined, <ElementConfig>config)
      );

    case 'o--body':
      return Portal('body', Slot);

    case 'o--head':
      return Portal('body', Slot);

    case 'o--portal':
      return Portal(config.to, Slot)

    case 'remount-view':
      if (!Slot) throw new Error(`Extraneous <remount-view>`)
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

  function Portal(container: string | Element, render: RenderFunction | RawJSXNode) {
     if (!(isFunction(render))) throw new Error('Compiler failed to turn JSX into render function')
      
       const output = processJSXOutput(render())
    
       
  }
}