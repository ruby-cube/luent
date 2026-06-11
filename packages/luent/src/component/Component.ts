import { AnyObject } from "@rue/types";
import { ComponentConfig, RawJSXNode } from "../node/makeJSXNode";
import { isObject, normalizeToArray } from "@rue/utils";
import { initializeRef, InternalRef, isNodesRef } from "../node/NodeRef";
import { JSXNode } from "../node/VineNode";
import { NodeRefsConfig, setUpNodeRefs } from "../node/NodeRefs";
import { setUpHooks } from "../flask/template-hooks";
import { JSXComponent } from "@rue/nextscript";
import type { ComponentKit } from "@rue/nextscript";
import { composeHooks, composeRef, toSetup } from "./bindings";
import { $from } from "../utils/destructure";


export type ComponentTag<P extends never | AnyObject = never | AnyObject> = P extends never ? () => ComponentKit<unknown> : (setup?: P) => ComponentKit<unknown>

export const template = JSXComponent; // TODO: Temporary

export type InferSlot<T extends ComponentTag = ComponentTag> =
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
  Component: ComponentTag,
  fromTag: ComponentConfig,
): ComponentKit<unknown> {

  const setup = toSetup(fromTag)
  const componentHooks = composeHooks(setup)
  const output = Component($from(setup)) // TODO: handle forwarded named slots

  if (output instanceof Promise)
    throw new Error("Components cannot return a promise. Use Suspense and pend to handle promises within component setup")
  const compode = output.component

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

  // if (tag['show-if']) setUpConditionalDisplay()
  return output
}



