import { AnyObject } from "@luent/types";
import { ComponentConfig } from "../node/makeJSXNode";
import { isObject, normalizeToArray } from "@luent/utils";
import { initializeRef } from "../node/NodeRef";
import { JSXNode } from "../node/VineNode";
import { setUpNodeRefs } from "../node/NodeRefs";
import { setUpHooks } from "../flask/template-hooks";
import { JSXComponentAs } from "@luent/nextscript";
import type { ComponentKit } from "@luent/nextscript";
import { composeHooks, composeRef, toSetup } from "./bindings";
import { $from } from "../utils/destructure";
import { RenderTag } from "./bindings-types";


// export type RenderTag<P extends never | AnyObject = never | AnyObject> = P extends never ? () => RawJSXNode : (setup?: FromTag<P>) => RawJSXNode

export const component = JSXComponentAs;

export type InferSlot<T extends RenderTag = RenderTag> =
  T extends (setup?: infer P) => any ?
  P extends { Slot: infer S } ?
  S
  : undefined
  : undefined

export type SetupWithSlot = {
  Slot: ((...args: any[]) => any) | { [key: string]: (...args: any[]) => any }
}

export type ComponentSetupWithSlot<P extends SetupWithSlot = SetupWithSlot> =
  (setup?: P) => JSXNode

export function makeComponent(
  Component: RenderTag,
  fromTag: ComponentConfig,
): ComponentKit<unknown> {

  const setup = toSetup(fromTag)
  const componentHooks = composeHooks(setup)
  const output = Component($from(setup)) // TODO: handle forwarded named slots

  if (output instanceof Promise)
    throw new Error("Components cannot return a promise. Use Suspense and pend to handle promises within component setup")
  const compode = output?.component

  if (compode) {
    const ref = composeRef(setup) // throw if ref already used
    if (ref) {
      if (isObject(ref) && 'arr' in ref) {
        setUpNodeRefs(compode, ref.arr, normalizeToArray(ref.i))
      }
      else {
        initializeRef(ref, compode)
      }
    }
  }

  const hooks = composeHooks(setup) // TODO: I don't remember why I call composeHooks twice
  if (componentHooks && compode) {
    if (!hooks) throw new Error('Cannot auto-bind hooks to nested element if component exposes a component node. Use x-ray to auto-bind hooks to nested elements.')
    setUpHooks(compode, hooks) // TODO: can a component with no public
  }

  // TODO: if publicComponent and hooks has been nested, throw error?

  // if (tag['display-if']) setUpConditionalDisplay()
  return output
}



