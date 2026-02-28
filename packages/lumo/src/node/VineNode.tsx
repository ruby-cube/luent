import { debug, isObject, normalizeToArray } from "@rue/utils";
import { __DEV__checkIfTracked, INTERNAL_RENDER, Ion, isGetter, PRELUDE, queueInternalRender, watchToRender } from "@rue/quarky";
import { isComponentKit } from "../component/Component";
import { RawJSXNode, RenderFunction } from "./makeJSXNode";
import { $_run_with_, ContextSnapshot, FLASK, Flask } from "@rue/flask";
import { CONTEXT, ContextNode } from "../context/context-stack";
import { TRACE } from "../../../flask/debug";

export type JSXNode = DOMNode | VineNode

export interface DOMNode {
   remove: () => void
   after: (...nodes: (Node | string)[]) => void
}
export type DOMElement = Element

export class VineNode {
   parent: DOMParent | null | undefined
   preceding: VineNode | DOMNode | null | undefined
   nodes: (VineNode | DOMNode)[] | undefined

   get precedingLeaf(): DOMNode | null {
      const preceding = this.preceding;
      if (!preceding) {
         return null;
      }
      if ('remove' in preceding) {
         return preceding;
      }
      return preceding.tailLeaf
   }

   get tail(): VineNode | DOMNode | null {
      return this.nodes?.at(-1) ?? null
   }

   get tailLeaf(): DOMNode | null {
      const tail = this.tail;
      if (!tail) {
         return this.precedingLeaf
      }
      if ('remove' in tail) {
         return tail;
      }
      return tail.tailLeaf
   }
}

// export interface NodeKit extends VineNode {
//    mount(root: DOMParent | DocumentFragment): void
// }

// export interface DynamicPodKit extends NodeKit {
//    // outerFlask: Flask
//    phasicNode?: TransitionNode | null
// }

// export interface CaseKit extends NodeKit {
//    // unmount(nodes: JSXNode[]): void
// }

export function processJSXOutput(rawJSX: RawJSXNode) {
   return _processJSXOutput(normalizeToArray(rawJSX))
}

/**
 * - spread arrays and components into root array
 * - get rid of undefined
 * @param jsxNodes 
 */
function _processJSXOutput(jsxNodes: RawJSXNode[], flattened: JSXNode[] = []) {
   for (const node of jsxNodes) {
      if (node instanceof Array) {
         _processJSXOutput(node, flattened)
      }
      else if (isComponentKit(node)) {
         _processJSXOutput(node.jsxNodes, flattened)
      }
      else if (isGetter(node)) {
         flattened.push(new DynamicTextNode(node))
      }
      else if (node == null || node === '') {
         continue;
      }
      else if (node instanceof VineNode) {
         flattened.push(node)
      }
      else if (node instanceof Element) {
         flattened.push(node)
      }
      else {
         flattened.push(createTextNode(node))
      }
   }
   return flattened;
}


export function setUpNodeVine(nodes: JSXNode[], parent: DOMParent, preceding: JSXNode | null = null) {
   for (const node of nodes) {
      if (node instanceof VineNode) {
         node.parent = parent
         node.preceding = preceding
         if (node.nodes) {
            setUpNodeVine(node.nodes, parent, preceding)
         }
      }
      preceding = node
   }
   return nodes;
}

// function isNodeKit(node: RawJSXNode): node is NodeKit {
//    return isObject(node) && 'remount' in node
// }


class DynamicTextNode extends VineNode {

   private node

   constructor(private $text: Ion<unknown>) {
      super()
      if ( __DEV__) __DEV__checkIfTracked()
      const textNode = this.node = createTextNode($text())
      this.nodes = [textNode]
      watchToRender($text, ({ current, previous, flask }) => {
         // if (current === previous) return;
         queueInternalRender(() => {
            textNode.data = toString($text());
         }, flask)
         //NOTE: We call the ion instead of using the current value passed in because, 
         // the time between PRELUDE and PAINT is long enough that the value may have changed already in cases of animation
         // Passing in current can cause weird lags as seen in the Sierpinski Triangle
      });
   }

   // mount(root: DOMParent | DocumentFragment) {
   //    root.appendChild(this.nodes![0] as unknown as Node)
   // }
}

function createTextNode(value: unknown) {
   return document.createTextNode(toString(value))
}

function toString(value: any) {
   if (value == null) return '';
   if (value instanceof Object) {
      return JSON.stringify(value);
   }
   return value.toString(); // TODO: make sure it works with any value
}


export function mountFragment(fragment: DocumentFragment, preceding: DOMNode | null | undefined, parent: DOMParent | null | undefined) {
   if (preceding && preceding !== parent) {
      preceding.after(fragment)
   }
   else
      parent?.prepend(fragment)
}

export type DOMParent = {
   appendChild(node: Node): Node,
   innerHTML: string,
   prepend: (...nodes: (Node | string)[]) => void
   append: (...nodes: (Node | string)[]) => void
} & DOMNode

export function mountDOMNodes(nodes: JSXNode[], root: DOMParent | DocumentFragment) {
   for (const node of nodes) {
      if (node instanceof Node) { // Node type from Web API
         root.appendChild(node)
      }
      // else if (isInnerHTMLKit(node)) {
      //    if (root instanceof DocumentFragment) {
      //       if ( __DEV__) console.error('Cannot append innerHTML to document fragment')
      //       return;
      //    }
      //    mountInnerHTML(node.innerHTML, root)
      // }
      else if (node instanceof VineNode) {
         if (!node.nodes) continue;
         mountDOMNodes(node.nodes, root)
      }
      else {
         debug.error('[[INVALID INPUT]] Invalid node entity', node)
      }
   }
}


export function removeDOMNodes(nodes: JSXNode[]) {
   forEachNode(nodes, (node) => node.remove())
}

export function forEachNode(nodes: JSXNode[], task: (node: DOMNode) => void) {
   let i = nodes.length
   while (i--) {
      const node = nodes[i]
      if (isDOMNode(node)) {
         task(node)
      }
      else if ('nodes' in node) {
         const nodes = node.nodes
         if (nodes) {
            forEachNode(nodes, task)
         }
      }
      else {
         debug.error('[[INVALID INPUT]] Invalid node entity')
      }
   }
}

function isDOMNode(node: unknown): node is DOMNode & Node {
   return node instanceof Node;
}

export type AsyncRender = (flask: Flask, input?: Object) => RawJSXNode

export function toAsyncRender(render: RenderFunction, context: ContextSnapshot, nestedContext: { [FLASK]: Flask | undefined, /* [CONTEXT]: ContextNode, */ [TRACE]: string }): AsyncRender {
   return (flask: Flask, ...args: any[]) => {
      nestedContext[FLASK] = flask
      return $_run_with_(context, () => render(...args), nestedContext)
   }
}