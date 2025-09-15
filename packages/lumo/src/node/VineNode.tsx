import { FLASK, Flask, getFlask } from "@rue/flask";
import { isInnerHTMLKit, mountInnerHTML } from "./InnerHTML";
import { debug, isObject } from "@rue/utils";
import { __DEV__checkIfTracked, Ion, isIon, toValue, watch } from "@rue/quarky";
import { queueInternalRenderTask, watchToRender } from "../render-cycle";
import { isComponentKit } from "../component/Component";
import { RawJSXNode } from "./makeJSXNode";
import { TransitionNode } from "../transition/TransitionNode";

export type JSXNode = DOMNode | VineNode | DynamicKit

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

export interface NodeKit extends VineNode {
   mount(nodes: JSXNode[], root: DOMParent | DocumentFragment): void
}

export interface DynamicPodKit extends NodeKit {
   outerFlask: Flask
   setUp(): void

   phasicNode?: TransitionNode | null
}

export interface DynamicKit extends VineNode {
   setUp(): void
}

export interface DynamicNodeKit extends NodeKit {
   unmount(nodes: JSXNode[]): void
}



/**
 * - spread arrays and components into root array
 * - get rid of undefined
 * @param jsxNodes 
 */
export function processJSXOutput(jsxNodes: RawJSXNode[], flattened: JSXNode[] = []) {
   for (const node of jsxNodes) {
      if (node instanceof Array) {
         processJSXOutput(node, flattened)
      }
      else if (isComponentKit(node)) {
         processJSXOutput(node.jsxNodes, flattened)
      }
      else if (isIon(node)) {
         flattened.push(new DynamicTextNode(node))
      }
      else if (node == null || node === '') {
         continue;
      }
      else if (isNodeKit(node)) {
         flattened.push(node)
      }
      else {
         flattened.push(createTextNode(node))
      }
   }
   return flattened;
}


export function setUpNodeVine(nodes: JSXNode[], parent: DOMParent) {
   let preceding = null
   for (const node of nodes) {
      if (isNodeKit(node)) {
         node.parent = parent
         node.preceding = preceding
         if (isDynamicKit(node)) node.setUp()
      }
      preceding = node
   }
}

function isNodeKit(node: RawJSXNode): node is NodeKit {
   return isObject(node) && 'mount' in node
}

function isDynamicKit(node: JSXNode): node is DynamicKit {
   return 'setUp' in node
}


class DynamicTextNode extends VineNode implements DynamicKit {

   private node

   constructor(private $text: Ion<unknown>) {
      super()
      if (__DEV__) __DEV__checkIfTracked()
      const textNode = this.node = createTextNode($text())
      this.nodes = [textNode]
   }

   setUp(): void {
      watchToRender(this.$text, ({ current, flask }) => {
         queueInternalRenderTask(() => {
            this.node.data = toString(current);
         }, flask)
      });
   }
}

function createTextNode(value: unknown) {
   return document.createTextNode(toString(value))
}

function toString(value: any) {
   if (value == null) return '';
   if (value instanceof Object) {
      return JSON.stringify(value);
   }
   return value.toString(); //TODO: make sure it works with any value
}


export function mountFragment(fragment: DocumentFragment, preceding: DOMNode | null | undefined, parent: DOMParent | null | undefined) {
   if (preceding && preceding !== parent)
      preceding.after(fragment)
   else
      parent?.append(fragment)
}

export type DOMParent = { appendChild(node: Node): Node, innerHTML: string, append: (...nodes: (Node | string)[]) => void } & DOMNode

export function mountDOMNodes(nodes: JSXNode[], root: DOMParent | DocumentFragment) {

   for (const node of nodes) {
      if (node instanceof Node) { // Node type from Web API
         root.appendChild(node)
      }
      else if (isInnerHTMLKit(node)) {
         if (root instanceof DocumentFragment) {
            if (__DEV__) console.error('Cannot append innerHTML to document fragment')
            return;
         }
         mountInnerHTML(node.innerHTML, root)
      }
      else if (isNodeKit(node)) {
         const nodes = node.nodes
         if (!nodes) {
            console.error('nodes are missing')
            continue;
         }
         node.mount(nodes, root)
      }
      else {
         debug.error('[[INVALID INPUT]] Invalid node entity')
      }
   }
}


export function removeDOMNodes(nodes: JSXNode[]) {
   forEachNode(nodes, (node) => node.remove())

   // let i = nodes.length
   // while (i--) {
   //    const node = nodes[i]
   //    if ('remove' in node) {
   //       node.remove()
   //    }
   //    else if ('nodes' in node) {
   //       const nodes = node.nodes
   //       if (nodes) {
   //          removeDOMNodes(nodes)
   //       }
   //    }
   //    else {
   //       debug.error('[[INVALID INPUT]] Invalid node entity')
   //    }
   // }
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