import { AnyObject } from "@luently/types";
import { ComponentConfig } from "../node/makeJSXNode";
import { isObject, normalizeToArray } from "@luently/utils";
import { initializeRef } from "../node/NodeRef";
import { JSXNode } from "../node/VineNode";
import { setUpNodeRefs } from "../node/NodeRefs";
import { setUpHooks } from "../flask/template-hooks";
import { JSXComponentAs } from "@luently/noriscript";
import type { ComponentKit } from "@luently/noriscript";
import { composeHooks, composeRef, toSetup } from "./bindings";
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
  const output = Component(normalize(setup)) // TODO: handle forwarded named slots

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




function isGetterKey(key: PropertyKey): key is `$${string}` {
  if (typeof key !== 'string') return false;
  return key.startsWith('$')
}

export function normalize<T extends object>(target: T) {
  if (typeof target !== 'object') throw new TypeError('target must be destructurable')
  return (new Proxy(target, {
    get(target, key, receiver) {
      
      if (isGetterKey(key)) {
        const valueKey = key.slice(1) as keyof T
        if (valueKey in target && target[valueKey] !== undefined) {
          const value = target[valueKey]
          if (isAccessor(value))
            return value
          return () => value
        }
        return undefined
      }

      if (isEmitterKey(key)) {
        const handler = target[key as keyof T]
        if (!handler) return noop;
        return handler;
      }
      return Reflect.get(target, key, receiver)
    },
    set() {
      return false;
    }
  }))
}

function noop() {}

const EMIT = 'emit'
const EMIT_LENGTH = EMIT.length


function isEmitterKey(value: PropertyKey): value is string {
  if (typeof value !== 'string') return false;
  const eventStart = value[EMIT_LENGTH]
  return value.startsWith(EMIT) && eventStart.toUpperCase() === eventStart
}

function isAccessor(value: unknown) {
  return typeof value === 'function' && value.length === 0
}
