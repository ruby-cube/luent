import { beforeUnmount, beforeDetach } from "../flask/flask-hooks";
import { writeToPortal } from "../server/portals";
import { isTransitioningOut } from "../transitions/transitions";
import { getFlask } from "@rue/flask";
import { queueTask } from "@rue/quarky";
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

function insertStyle(cssText: string, id: string) {
  const style = document.createElement('style');
  style.id = id;
  document.head.appendChild(style);
  style.textContent = cssText;
  return style;
}

function composeCSSText(strings: TemplateStringsArray, values: string[]) {
  return strings.reduce((cssText, string, i) => cssText + string + (i < values.length ? values[i] : ''), '')
}

export const css = declareStyles
export const style = declareStyles

export function Style(cssText: string) {
  const id = genUID(cssText)
  if (import.meta.env.SSR) {
    const style = `<style id="${id}">${cssText}</style>`
    writeToPortal('head', style)
    return;
  }
  const existing = document.querySelector('#' + id)
  if (existing) return;
  const style = insertStyle(cssText, id)
  const flask = getFlask()
  beforeUnmount(() => {
    if (isTransitioningOut(flask)) {
      queueTask(() => {
        flask.onDiscard(() => {
          style.remove()
        })
      })
      return;
    }
    style.remove(); // TODO: wait till end of transition to remove
  })
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