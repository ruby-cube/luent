// let shadow: ShadowRoot | undefined;

import { AsyncState } from "@rue/flask";
import { fromTag, RenderSlot } from "./x-Input";
import { DOMParent, processJSXOutput, VineNode } from "../node/VineNode";

// NOTE: The shadow-root helper does not work with VitePress :( 
// VitePress will dynamically construct static sites on navigation,
// causing declarative Shadow DOM, `<template shadowrootmode='open'>`
// to fail. Instead of parsing as a shadow root, it is parsed as a normal template element.



export const [inShadow, shadowStack] = AsyncState<true>('shadow')

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
      console.warn('DEV RESEARCH: Mounting a shadow root to a DocumentFragment should never happen')
      return;
    }
    this.nodes = processJSXOutput(callWithShadowRoot(this.Slot))
    super.mount(root.attachShadow({ mode: this.mode }))
  }
}

export function callWithShadowRoot(render: RenderSlot) {
  try {
    shadowStack.push(true)
    return render()
  }
  finally {
    shadowStack.pop()
  }
}


export function renderInShadow(Slot: RenderSlot) {
  return import.meta.env.SSR
    ?
    <style-scope>
      <template>
        {callWithShadowRoot(Slot)}
      </template>
    </style-scope>
    : <shadow-root mode='open'>
      {Slot()}
    </shadow-root>
}