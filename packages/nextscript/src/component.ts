import { RawJSXNode } from "luent";
import { isObject, normalizeToArray } from "@luent/utils";

export interface ComponentKit<T = undefined> {
  component: T
  nodes: unknown[];
}

export function JSXComponent(template: JSX.Element | JSX.Element[]): ComponentKit<undefined> {
  const nodes = normalizeToArray(template ? unnestComponent(template) : undefined)

  return {
    get component() { return undefined },
    nodes,
  }
}

export function JSXComponentAs<T>(component: T, template: JSX.Element | JSX.Element[]): ComponentKit<T> {
  const nodes = normalizeToArray(template ? unnestComponent(template) : undefined)

  return {
    get component() { return component },
    nodes,
  }
}


JSXComponent.as = function expose<T>(component: T) {
  return function Component(template: JSX.Element): ComponentKit<T> {
    return JSXComponentAs(component, template)
  }
}

export function unnestComponent(nodes: unknown): RawJSXNode {
  const isArray = Array.isArray(nodes);
  if (isArray && nodes.length > 1) return nodes;
  const entity = isArray ? nodes[0] : nodes;
  if (isComponentKit(entity)) {
    if (entity.component)
      return nodes as RawJSXNode;
    return entity.nodes;
  }
  return nodes as RawJSXNode
}

export function isComponentKit(entity: unknown): entity is ComponentKit<unknown> {
  return isObject(entity) && 'component' in entity && 'nodes' in entity // TODO: this seems like many things can be mistaken for a component kit.
}