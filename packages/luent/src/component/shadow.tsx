// let shadow: ShadowRoot | undefined;

import { AsyncState } from "@luently/flask";
import { FromTag, RenderTag } from "./bindings-types";
import { DOMParent, processJSXOutput, VineNode } from "../node/VineNode";

// NOTE: The shadow-root helper does not work with VitePress :( 
// VitePress will dynamically construct static sites on navigation,
// causing declarative Shadow DOM, `<template shadowrootmode='open'>`
// to fail. Instead of parsing as a shadow root, it is parsed as a normal template element.



export const [inShadow, shadowStack] = AsyncState<true | ShadowRoot>('shadow')

export function createShadowRoot(setup: { Slot: RenderTag } & ShadowRootInit) {
  const { Slot, mode } = setup
  return new ShadowRootKit(mode, Slot)
}

export function writeShadowRoot(setup: { Slot: RenderTag } & ShadowRootInit) {
  const { Slot, mode } = setup
  return (
    <template data-shadowrootmode={mode}>
      {callWithShadowRoot(Slot, true)}
    </template>
  )
}

class ShadowRootKit extends VineNode {

  constructor(
    public mode: 'open' | 'closed',
    public Slot: RenderTag
  ) {
    super()
  }

  override mount(root: DOMParent | DocumentFragment): void {
    if (root instanceof DocumentFragment) {
      if (__INTERNAL__) console.warn('DEV RESEARCH: Mounting a shadow root to a DocumentFragment should never happen')
      return;
    }
    const shadowRoot = (root as unknown as HTMLElement).attachShadow({ mode: this.mode })
    this.nodes = processJSXOutput(callWithShadowRoot(this.Slot, shadowRoot))
    super.mount(shadowRoot)
  }
}

export function callWithShadowRoot(render: RenderTag, shadowRoot: ShadowRoot | true) {
  try {
    shadowStack.push(shadowRoot)
    return render()
  }
  finally {
    shadowStack.pop()
  }
}


export function ShadowRoot(setup: FromTag<{ Slot: RenderTag }>) {
  const { Slot } = setup

  return import.meta.env.SSR
    ?
    <style-scope>
      <template>
        {callWithShadowRoot(Slot, inShadow())}
      </template>
    </style-scope>
    : createShadowRoot({ mode: 'open', Slot })


  // <shadow-root mode='open'>
  //   {Slot()}
  // </shadow-root>
}


// This is needed because Vitepress removes style tags. So we need to create a 'black box' via custom element
export function defineStyleScopeElement() {
  // define custom elements
  if (!customElements.get('style-scope')) {
    customElements.define('style-scope', class StyleScope extends HTMLElement {
      connectedCallback() {
        const template = this.querySelector('template')
        const content = template?.content.cloneNode(true) as DocumentFragment | undefined

        const slot = content ?? document.createElement('slot')
        const root = this.attachShadow({ mode: 'open' });
        root.appendChild(slot)
        // if (template) template.remove()
      }
    });
  }
}