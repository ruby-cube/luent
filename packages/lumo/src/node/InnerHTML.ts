import { isIon, __devCheckIfTracked, watch } from "@rue/quarky";
import { isObjectLiteral } from "@rue/utils";
import { NodeEntity } from "./makeNode";
import { RENDER } from "../render-cycle";



export function setUpInnerHTML(kit: InnerHTMLKit, parentNode: Element) {
   //  nodePod.appendStaticNode(textNode) //QUESTION: do we need to append innerHTML to nodePod??, we don't have to worry about siblings, so idon't think so
   const htmlString = kit.innerHTML;
   if (isIon(htmlString)) {
      keepInnerHTMLUpdated(htmlString, parentNode)
   }
   return kit
}

export function mountInnerHTML(kit: InnerHTMLKit, parent: Element) {
   const htmlString = kit.innerHTML;
   //  const root = fragment ? fragment : parent; //QUESTION: do I need to ever append to a fragment? a fragment doesn't have inner html property
   parent.innerHTML = isIon(htmlString) ? htmlString() : htmlString;
}

function keepInnerHTMLUpdated(htmlString: ReactiveGet<any>, parentNode: Element) {
   watch(htmlString, ({ state }) => {
      parentNode.innerHTML = toString(state);
   }, { phase: RENDER });
}




function toString(value: any) {
   return value.toString(); //TODO: make sure it works with any value
}

export type InnerHTMLKit = { innerHTML: MaybeIon<string> }
export function isInnerHTMLKit(nodeEntity: NodeEntity): nodeEntity is InnerHTMLKit {
   return isObjectLiteral(nodeEntity) && 'innerHTML' in nodeEntity
}