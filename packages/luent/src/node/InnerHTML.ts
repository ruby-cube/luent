import { __DEV__checkIfTracked, Ion, toValue, isGetter, trackForRender, queueRender, RUN_EAGERLY, queueInternalRender } from "@luent/quarky";
import { MaybeIon } from "../component/bindings-types";
import { DOMParent } from "./VineNode";
import { getFlask } from "@luent/flask";
import { isObject } from "@luent/utils";

export function isInnerHTMLKit(entity: any): entity is InnerHTMLKit {
  return isObject(entity) && 'html' in entity
}

export function setUpInnerHTML(kit: InnerHTMLKit, parentNode: DOMParent) {
  //  nodePod.appendStaticNode(textNode) //QUESTION: do we need to append innerHTML to nodePod??, we don't have to worry about siblings, so idon't think so
  const { trusted, html } = kit;
  if (isGetter(html)) {
    trackForRender(html, () => {
      queueInternalRender(() => {
        setInnerHTML(html(), trusted, parentNode)
      })
    }, getFlask(), true);
  }
  else {
    setInnerHTML(toString(html), trusted, parentNode)
  }
}

function setInnerHTML(html: string, trusted: boolean | undefined, node: DOMParent) {
  if (trusted) {
    node.innerHTML = html
  }
  else if ('setHTML' in node) {
    node.setHTML(html)
  }
  else {
    throw new Error('html must be sanitized or marked trusted')
  }
}






function toString(value: any) {
  return value == null ? "" : String(value);
}

// function getHTMLSanitizer(kit: InnerHTMLKit): (html: string) => string {
//   if (kit.trustedHTML) {
//     return passthroughHTML;
//   }
//   if (kit.sanitizeHTML) {
//     return kit.sanitizeHTML;
//   }
//   return defaultSanitizeHTML;
// }

// function defaultSanitizeHTML(html: string): string {
//   return DOMPurify.sanitize(html, {
//     USE_PROFILES: { html: true },
//   });
// }

function passthroughHTML(html: string): string {
  return html;
}

export type InnerHTMLKit = {
  trusted?: boolean
  html: MaybeIon<string>,
}

// <div innerHTML={{ 
//    trusted: true,
//    html: <div></div>
// }}></div>

// <div innerHTML={trusted(`
//    <div>Hello world</div> 
//`)}></div>

// <div innerHTML={sanitize(`
//    <div>Hello world</div> 
//`)}></div>

// export function isInnerHTMLKit(nodeEntity: RawJSXNode): nodeEntity is InnerHTMLKit {
//    return isPlainObject(nodeEntity) && 'innerHTML' in nodeEntity
// }