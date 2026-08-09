import { beforeUnmount, beforeDetach, atMount } from "../flask/flask-hooks";
import { writeToPortal } from "../server/portals";
import { isTransitioningOut } from "../transitions/transitions";
import { Flask, getFlask } from "@luent/flask";
import { atRender, atTick, queueTask } from "@luent/quarky";
import { inShadow } from "./shadow";
// import { createHash } from "node:crypto";


// async function hashText(text: string) {
//   if (import.meta.env.SSR) return createHash('sha256').update(text).digest('hex').slice(0, 12)
//   const bytes = new TextEncoder().encode(text)
//   const digest = await crypto.subtle.digest('SHA-256', bytes)
//   return [...new Uint8Array(digest)]
//     .map(b => b.toString(16).padStart(2, '0'))
//     .join('')
//     .slice(0, 12)
// }

// TODO: dynamic styling?
function declareStyles(strings: TemplateStringsArray, ...values: any[]): string {
  return composeCSSText(strings, values)
}

function createStyleTag(cssText: string, id: string, shadow: true | undefined) {
  const style = document.createElement('style');
  style.id = id;
  style.textContent = cssText;
  return style;
}



function composeCSSText(strings: TemplateStringsArray, values: string[]) {
  return strings.reduce((cssText, string, i) => cssText + string + (i < values.length ? values[i] : ''), '')
}

export const css = declareStyles
export const style = declareStyles


let existingStyleTags: Set<string> | undefined;

export function RenderPageWithStyles() {
  const tags = new Set<string>();
  return function renderPage(render: () => any) {
    try {
      existingStyleTags = tags;
      return render()
    }
    finally {
      existingStyleTags = undefined;
    }
  }
}

export function Style(cssText: string) {
  const id = genUID(cssText)
  const shadow = inShadow()
  if (import.meta.env.SSR) {
    if (existingStyleTags?.has(id)) {
      return;
    }
    existingStyleTags?.add(id)
    const style = `<style id="${id}">${cssText}</style>`
    if (shadow) return { element: style }
    writeToPortal('head', style)
    return;
  }
  const flask = getFlask()
  if (shadow) {
    const existing = shadow.querySelector('#' + id) // TODO: check shadow instead of document?
    if (existing) {
      return;
    }
    const style = createStyleTag(cssText, id, shadow)
    beforeUnmount(() => {
      discardStyleTag(style, flask)
    })
    shadow.appendChild(style)
    return;
  }
  atMount(() => { // QUESTION: Why do things break when this is atRender instead of atMount?
    const existing = document.querySelector('#' + id)
    if (existing) {
      return;
    }
    const style = createStyleTag(cssText, id, shadow)
    if (style) {
      document.head.appendChild(style);
      beforeUnmount(() => {
        style.id = style.id + '_unmounting'
        discardStyleTag(style, flask)
      })
    }
  })
}


function discardStyleTag(style: HTMLStyleElement, flask: Flask) {
  if (isTransitioningOut(flask)) {
    queueTask(() => {
      flask.onDiscard(() => {
        style.remove()
      })
    })
    return;
  }
  style.remove();
}

function hash(text: string): string {
  let h = 2166136261

  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }

  return (h >>> 0).toString(36)
}

function normalizeCSS(css: string) {
  return css.replace(/\r\n/g, '\n').trim()
}

function genUID(css: string) {
  return 's-' + hash(normalizeCSS(css))
}