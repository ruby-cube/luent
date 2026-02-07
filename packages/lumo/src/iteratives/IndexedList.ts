import { $_derivation, Ion, Ionic, queueInternalRender, toValue, watchToRender } from "@rue/quarky";
import { MaybeIon } from "../component/Input";
import { AnyObject } from "@rue/types";
import { RawJSXNode } from "../node/makeJSXNode";
import { DOMNode, JSXNode, mountDOMNodes, mountFragment, processJSXOutput, removeDOMNodes, VineNode } from "../node/VineNode";
import { ListItemKit, ListKit } from "./ItemList";
import { Flask } from "@rue/flask";

type Nullish = null | undefined

type RenderIndex = ($item: Ion<any>, index: number) => RawJSXNode

export function ForIndex(list: MaybeIon<AnyObject | Nullish>, renderIndex: RenderIndex) {
   // const items = list instanceof Array
   //    ? list
   //    : list instanceof Set
   //       ? list.values()
   //       : list instanceof Map
   //          ? list.entries()
   //          : Object.keys(list)

   // const $length = Ion(() => {
   //    // TODO:
   //    return 0
   // })
}




export class IndexedListKit extends VineNode {
   constructor(
      public list: Ionic<any[]>,
      $length: Ion<number>,
      public renderIndex: RenderIndex,
      public flask: Flask
   ) {
      super()
      this.nodes = this.render(list, renderIndex) as IndexKit[];

      watchToRender($length, ({ current, previous }) => {
         console.log('*** currentLength', current)
         console.log('*** previousLength', previous)
         const kits = this.nodes as IndexKit[]
         console.log('*** kits', kits)
         if (current > previous) {
            let preceding = kits[previous - 1] ?? this.preceding
            // add indexes
            const fragment: DocumentFragment | null = new DocumentFragment()
            for (let i = previous; i < current; i++) {
               const $item = Ion(list![i])
               const kit = new IndexKit($item, i, renderIndex, this.flask)
               kit.parent = this.parent;
               kit.preceding = preceding;
               kits.push(kit)

               watchToRender(() => list[i], ({ current: item }) => {
                  $item.value = item
               }, kit.flask)

               mountDOMNodes(kit.nodes!, fragment)
            }
            console.log('*** precedingLeaf', kits[previous].precedingLeaf)
            queueInternalRender(() => {
               // mount to fragment
               // for (let i = previous; i < current; i++) {
               //    const kit = kits[i]
               // }
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

   private render(list: Ionic<any[]>, renderIndex: RenderIndex) {
      const nodes: JSXNode[] = []

      let index = 0

      for (const item of list) {
         const $item = Ion(item)
         const kit = new IndexKit($item, index, renderIndex, this.flask)
         nodes.push(kit)
         watchToRender(() => list[index], ({ current: item }) => {
            $item.value = item
         }, kit.flask)
         index++
      }
      return nodes;
   }
}


class IndexKit extends VineNode {
   flask: Flask

   constructor(
      public $item: Ion,
      public index: number,
      public render: RenderIndex,
      outerFlask: Flask
   ) {
      super()
      const flask = this.flask = outerFlask.spawn({ type: 'view', creationScope: true })
      this.nodes = processJSXOutput(this.render($_derivation(() => $item()), index))
      flask.emitInitialMount()
   }
}


