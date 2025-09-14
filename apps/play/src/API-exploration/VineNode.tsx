import { FLASK, Flask } from "@rue/flask";
import { DOMNode, DOMRoot, queueInternalRenderTask, watchToRender } from "@rue/lumo";

class VineNode {
   parent: DOMRoot | null | undefined
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

interface NodeKit {
   mount(nodes: VineNode | DOMNode, fragment?: DocumentFragment): void
}

interface DynamicPodKit extends NodeKit {
   outerFlask: Flask
   setUp(): void
}

interface DynamicNodeKit extends NodeKit {
   unmount(nodes: VineNode | DOMNode,): void
}


function makeConditional(series) {

   const nodes = this.activateConditional()

   return {
      nodes,
      parent: undefined,
      preceding: undefined,
      get precedingElement() {

      },
      get tail() { this.roots.at(-1) ?? null },
      get leafTail() {

      },
      setUp() {
         watchToRender($conditions, () => {
            this.deactivateConditional();
            this.activateConditional()
         })
      },

      mount(nodes: any[], fragment: DocumentFragment | undefined) {
         const root = fragment ?? this.parent

         mountDOMNodes(root, nodes)

         if (fragment) {
            mountFragment(fragment, this.preceding, this.parent)
         }
      },

      unmount(nodes) {
         removeDOMNodes(this.nodes)
      }

      activateConditional() {
         const activeIndex = evaluateConditional()
         const kit = getConditionalKit(activeIndex)
         const flask = kit.flask ?? (kit.flask = this.outerFlask.spawn({ type: 'view' }))
         kit.nodes = this.nodes = $_run_with(context, kit.render, { [FLASK]: flask });
         queueInternalRenderTask(() => {
            this.mount(kit.nodes, new DocumentFragment())
            kit.flask.emitInitialMount()
         })
      }

      deactivateConditional() {
         const kit = this.kits[this.activeIndex]
         const prevNodes = kit.nodes;
         kit.nodes = null;
         kit.flask.emitDiscard()
         queueInternalRenderTask(() => {
            this.unmount(prevNodes)
         })
         return kit;
      }
   };
}

function makeList() {

   const nodeEntities = this.nodeEntities = []
   for (const item of list) {
      nodeEntities.push(makeListItem(item, index, render))
   }
   
   return {

      setUp() {
         watchToRender(){

         }
      },
      mount() {
         const nodeEntities = this.nodeEntities;
         for (const item of nodeEntities) {
            item.mount()
         }
      }
   }
}

function makeListItem() {

   return {
      setUp() {
         const nodeEntities = this.nodeEntities = render()
      },
      mount,
      unmount
   }
}

function removeDOMNodes(nodeEntities: (VineNode | DOMNode)[]) {
   let i = nodeEntities.length
   while (i--) {
      const node = nodeEntities[i]
      if ('remove' in node) {
         node.remove()
      }
      else if ('nodes' in node) {
         const nodes = node.nodes
         if (nodes)
            removeDOMNodes(nodes)
      }
   }
}


function mountFragment(fragment: DocumentFragment, preceding: DOMRoot | null, parent: DOMRoot | null) {
   if (preceding && preceding !== parent)
      preceding.after(fragment)
   else
      parent?.append(fragment)
}


function makeElement(tag, Slot) {
   const element = document.createElement(tag)

   const nodes = Slot() as (VineNode & (NodeKit | DynamicNodeKit) | DOMNode)[]

   let preceding = null
   for (const node of nodes) {
      if (isNodeKit(node)) {
         node.parent = element
         node.preceding = preceding
         if ('setUp' in node) node.setUp()
      }
      preceding = node
   }

   return element;
}

function isNodeKit(node: NodeKit | DOMNode): node is NodeKit & VineNode {
   return 'setUp' in node
}


// setup

// mounting