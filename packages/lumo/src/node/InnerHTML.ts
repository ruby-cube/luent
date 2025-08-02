import { isIon, __DEV__checkIfTracked, watch, Ion, toValue } from "@rue/quarky";
import { isObjectLiteral } from "@rue/utils";
import { JSXNode } from "./makeNode";
import { MaybeIon } from "../component/Input";
import { INTERNAL_RENDER, PRERENDER, queueInternalRender, watchForRender } from "../render-cycle";
import { getFlask } from "@rue/flask";



export function setUpInnerHTML(kit: InnerHTMLKit, parentNode: Element) {
   //  nodePod.appendStaticNode(textNode) //QUESTION: do we need to append innerHTML to nodePod??, we don't have to worry about siblings, so idon't think so
   const htmlString = kit.innerHTML;
   if (isIon(htmlString)) {
      keepInnerHTMLUpdated(htmlString, parentNode)
   }
   return htmlString;
}

export function mountInnerHTML(htmlString: MaybeIon<string>, parent: Element) {
   parent.innerHTML = toValue(htmlString)
}

function keepInnerHTMLUpdated(htmlString: Ion<any>, parentNode: Element) {
    const flask = getFlask()
   watchForRender(htmlString, () => {
      queueInternalRender(() => {
         parentNode.innerHTML = toString(htmlString());
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