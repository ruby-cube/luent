import { isIon, __DEV__checkIfTracked, Ion, toValue, isGetter } from "@rue/quarky";
import { isObjectLiteral } from "@rue/utils";
import { RawJSXNode } from "./makeJSXNode";
import { MaybeIon } from "../component/Input";
import { INTERNAL_RENDER, queueInternalRender, watchToRender } from "../../../quarky/src/reactivity/RenderCycle";
import { DOMElement, DOMParent } from "./VineNode";



export function setUpInnerHTML(kit: InnerHTMLKit, parentNode: DOMParent) {
   //  nodePod.appendStaticNode(textNode) //QUESTION: do we need to append innerHTML to nodePod??, we don't have to worry about siblings, so idon't think so
   const htmlString = kit.innerHTML;
   if (isGetter(htmlString)) {
      watchToRender(htmlString, ({ flask }) => {
         queueInternalRender(() => {
            parentNode.innerHTML = toString(htmlString());
         }, flask)
      });
   }
   return htmlString;
}

// export function mountInnerHTML(htmlString: MaybeIon<any>, parent: DOMParent) {
//    parent.innerHTML = toString(toValue(htmlString))
// }





function toString(value: any) {
   return value.toString(); // TODO: make sure it works with any value
}

export type InnerHTMLKit = { innerHTML: MaybeIon<string> }
// export function isInnerHTMLKit(nodeEntity: RawJSXNode): nodeEntity is InnerHTMLKit {
//    return isObjectLiteral(nodeEntity) && 'innerHTML' in nodeEntity
// }