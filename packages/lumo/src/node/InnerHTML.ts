import { isIon, __DEV__checkIfTracked, watch, Ion, toValue } from "@rue/quarky";
import { isObjectLiteral } from "@rue/utils";
import { JSXNode } from "./makeJSXNode";
import { MaybeIon } from "../component/Input";
import { INTERNAL_RENDER, PRERENDER, queueInternalRenderTask, watchToRender } from "../render-cycle";
import { getFlask } from "@rue/flask";



export function setUpInnerHTML(kit: InnerHTMLKit, parentNode: Element) {
   //  nodePod.appendStaticNode(textNode) //QUESTION: do we need to append innerHTML to nodePod??, we don't have to worry about siblings, so idon't think so
   const htmlString = kit.innerHTML;
   if (isIon(htmlString)) {
      keepInnerHTMLUpdated(htmlString, parentNode)
   }
   return htmlString;
}

export function mountInnerHTML(htmlString: MaybeIon<any>, parent: Element) {
   parent.innerHTML = toString(toValue(htmlString))
}

function keepInnerHTMLUpdated(htmlString: Ion<any>, parentNode: Element) {
   const flask = getFlask()
   watchToRender(htmlString, ({ current }) => {
      queueInternalRenderTask(() => {
         parentNode.innerHTML = toString(current);
      }, flask)
   }, flask);
}




function toString(value: any) {
   return value.toString(); //TODO: make sure it works with any value
}

export type InnerHTMLKit = { innerHTML: MaybeIon<string> }
export function isInnerHTMLKit(nodeEntity: JSXNode): nodeEntity is InnerHTMLKit {
   return isObjectLiteral(nodeEntity) && 'innerHTML' in nodeEntity
}