// let shadow: ShadowRoot | undefined;

import { AsyncState } from "@luent/flask";
import { FromTag, RenderSlot } from "./bindings-types";
import { DOMParent, processJSXOutput, VineNode } from "../node/VineNode";

// NOTE: The shadow-root helper does not work with VitePress :( 
// VitePress will dynamically construct static sites on navigation,
// causing declarative Shadow DOM, `<template shadowrootmode='open'>`
// to fail. Instead of parsing as a shadow root, it is parsed as a normal template element.



export const [inShadow, shadowStack] = AsyncState<true | ShadowRoot>('shadow')

export function createShadowRoot(setup: { Slot: RenderSlot } & ShadowRootInit) {
  const { Slot, mode } = setup
  return new ShadowRootKit(mode, Slot)
}

export function writeShadowRoot(setup: { Slot: RenderSlot } & ShadowRootInit) {
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
    public Slot: RenderSlot
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

export function callWithShadowRoot(render: RenderSlot, shadowRoot: ShadowRoot | true) {
  try {
    shadowStack.push(shadowRoot)
    return render()
  }
  finally {
    shadowStack.pop()
  }
}


export function ShadowRoot(setup: FromTag<{Slot: RenderSlot}>) {
  const {Slot} = setup
  return import.meta.env.SSR
    ?
    <style-scope>
      <template>
        {callWithShadowRoot(Slot, inShadow())}
      </template>
    </style-scope>
    : <shadow-root mode='open'>
      {Slot()}
    </shadow-root>
}