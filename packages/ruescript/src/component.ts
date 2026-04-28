import { isObject, normalizeToArray } from "@rue/utils";

export interface ComponentKit<T = undefined> {
   as: T
   nodes: unknown[];
}

export function JSXComponent(template: JSX.Element | JSX.Element[]): ComponentKit<undefined> {
   const nodes = normalizeToArray(template ? unnestComponent(template) : undefined)

   return {
      get as() { return undefined },
      nodes,
   }
}

export function JSXComponentAs<T>(component: T, template: JSX.Element | JSX.Element[]): ComponentKit<T> {
      const nodes = normalizeToArray(template ? unnestComponent(template) : undefined)

   return {
      get as() { return component },
      nodes,
   }
}


JSXComponent.as = function expose<T>(component: T) {
   return function Component(template: JSX.Element): ComponentKit<T> {
      return JSXComponentAs(component, template)
   }
}

export function unnestComponent(nodes: unknown) {
   const isArray = Array.isArray(nodes);
   if (isArray && nodes.length > 1) return nodes;
   const entity = isArray ? nodes[0] : nodes;
   if (isComponentKit(entity)) {
      if (entity.as)
         return nodes;
      return entity.nodes;
   }
   return nodes
}

export function isComponentKit(entity: unknown): entity is ComponentKit<unknown> {
   return isObject(entity) && 'as' in entity && 'nodes' in entity
}