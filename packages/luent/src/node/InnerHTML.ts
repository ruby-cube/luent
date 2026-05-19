import {  __DEV__checkIfTracked, Ion, toValue, isGetter, watchToRender, queueRender } from "@rue/quarky";
import { MaybeIon } from "../component/x-Input";
import { DOMParent } from "./VineNode";
import DOMPurify from "dompurify";



export function setUpInnerHTML(kit: InnerHTMLKit, parentNode: DOMParent) {
   //  nodePod.appendStaticNode(textNode) //QUESTION: do we need to append innerHTML to nodePod??, we don't have to worry about siblings, so idon't think so
   const htmlString = kit.innerHTML;
   const sanitizeHTML = getHTMLSanitizer(kit);
   if (isGetter(htmlString)) {
      watchToRender(htmlString, ({ flask }) => {
         queueRender(() => {
            parentNode.innerHTML = sanitizeHTML(toString(htmlString()));
         })
      });
   }
   return htmlString;
}

// export function mountInnerHTML(htmlString: MaybeIon<any>, parent: DOMParent) {
//    parent.innerHTML = toString(toValue(htmlString))
// }





function toString(value: any) {
   return value == null ? "" : String(value);
}

function getHTMLSanitizer(kit: InnerHTMLKit): (html: string) => string {
   if (kit.trustedHTML) {
      return passthroughHTML;
   }
   if (kit.sanitizeHTML) {
      return kit.sanitizeHTML;
   }
   return defaultSanitizeHTML;
}

function defaultSanitizeHTML(html: string): string {
   return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
   });
}

function passthroughHTML(html: string): string {
   return html;
}

export type InnerHTMLKit = {
   innerHTML: MaybeIon<string>,
   trustedHTML?: boolean, // TODO:
   sanitizeHTML?: (html: string) => string, // TODO:
}
// export function isInnerHTMLKit(nodeEntity: RawJSXNode): nodeEntity is InnerHTMLKit {
//    return isPlainObject(nodeEntity) && 'innerHTML' in nodeEntity
// }