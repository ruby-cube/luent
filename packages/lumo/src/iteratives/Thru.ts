import { Ion, isGetter, queueInternalRender, watchToRender } from "@rue/quarky";
import { MaybeIon } from "../component/Input";
import { RawJSXNode } from "../node/makeJSXNode";
import { JSXNode, mountDOMNodes, mountFragment, processJSXOutput, removeDOMNodes, toAsyncRender, VineNode } from "../node/VineNode";
import { Flask, getFlask } from "@rue/flask";
import { toAsyncRenderItem } from "./ItemList";
import { markInitialRender, unmarkInitialRender } from "../transitions/transitions";

export function Thru(count: MaybeIon<number>, render: (count: number, index: number) => RawJSXNode) {
   if (isGetter(count)) {
      return new ThruKit(count, toAsyncRenderItem(render), getFlask())
   }
   else {
      const nodes = []
      for (let i = 0; i < count; i++) {
         nodes.push(render(i + 1, i))
      }
      return nodes
   }
}



type RenderCount = (count: number, index: number) => RawJSXNode


export class ThruKit extends VineNode {
   constructor(
      $count: Ion<number>,
      public renderCount: RenderCount,
      public flask: Flask
   ) {
      super()
      try {
         markInitialRender(true)
         this.nodes = this.render($count(), renderCount) as ThruKit[];
      }
      finally {
         unmarkInitialRender()
         watchToRender($count, ({ current, previous }) => {
            const kits = this.nodes as CountKit[]
            if (current > previous) {
               let preceding = kits[previous - 1] ?? this.preceding
               const fragment: DocumentFragment | null = new DocumentFragment()
               for (let i = previous; i < current; i++) {
                  const kit = new CountKit(i + 1, i, renderCount, this.flask)
                  kit.parent = this.parent;
                  kit.preceding = preceding;
                  kits.push(kit)
                  mountDOMNodes(kit.nodes!, fragment)
               }
               queueInternalRender(() => {
                  // mount to fragment
                  mountFragment(fragment, kits[previous].precedingLeaf, this.parent)
               }, this.flask)
            }
            else if (current < previous) {
               // delete indexes
               const removed = kits.splice(current, previous - current)
               for (const kit of removed) {
                  queueInternalRender(() => {
                     removeDOMNodes(kit.nodes!)
                     kit.nodes = undefined;
                  }, this.flask)
                  kit.flask.emitDiscard()
               }
            }
         }, flask)
      }

   }

   private render(count: number, renderCount: RenderCount) {
      const nodes: JSXNode[] = []

      for (let i = 0; i < count; i++) {
         const kit = new CountKit(i + 1, i, renderCount, this.flask)
         nodes.push(kit)
      }
      return nodes;
   }
}


class CountKit extends VineNode {
   flask: Flask

   constructor(
      public count: number,
      public index: number,
      public render: RenderCount,
      outerFlask: Flask
   ) {
      super()
      const flask = this.flask = outerFlask.spawn({ type: 'view', creationScope: true })
      this.nodes = processJSXOutput(this.render(count, index))
      flask.emitInitialMount()
   }
}


