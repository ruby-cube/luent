import { $_derivation, Ion, Ionic, isIonicProxy, PRELUDE, queueInternalRender, toValue, watch, watchToRender } from "@rue/quarky";
import { MaybeIon } from "../component/Input";
import { AnyObject } from "@rue/types";
import { RawJSXNode } from "../node/makeJSXNode";
import { DOMNode, JSXNode, mountDOMNodes, mountFragment, processJSXOutput, removeDOMNodes, VineNode } from "../node/VineNode";
import { Flask, getActiveFlask, getFlask } from "@rue/flask";

type Nullish = null | undefined

type RenderIndex = ($item: Ion<any>, index: number) => RawJSXNode

export function ForIndex(input: MaybeIon<AnyObject | Nullish>, renderIndex: RenderIndex) {
   const ionicList = isIonicProxy(input) ? input as any as Ionic<any[]> : Ionic([])

   function reconcile(ionicList: any[], newList: any[]) {
      for (let i = 0; i < newList.length; i++) {
         const item = newList[i]
         const oldItem = ionicList[i]
         if (item !== oldItem) {
            ionicList[i] = item
         }
      }
      if (newList.length < ionicList.length) {
         ionicList.splice(newList.length, ionicList.length - newList.length)
      }
   }

   const $length = Ion(() => ionicList.length ?? 0)

   watch(input, ({current}) => {
    if (ionicList === input) {
         return;
      }
      // const list = toValue(current)
      if (!current) {
         ionicList.length = 0
         return ionicList;
      }
      const newArray = current instanceof Array ? current : Symbol.iterator in current ? Array.from(current as Set<any>) : Object.keys(current)
      reconcile(ionicList, newArray)
   }, {eager: true, phase: PRELUDE})

   return new IndexedListKit(ionicList, $length, renderIndex, getFlask())
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
         const kits = this.nodes as IndexKit[]
         if (current > previous) {
            let preceding = kits[previous - 1] ?? this.preceding
            const fragment: DocumentFragment | null = new DocumentFragment()
            for (let i = previous; i < current; i++) {
               const $item = Ion(() => list[i])
               const kit = new IndexKit(list, $item, i, renderIndex, this.flask)
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

   private render(list: Ionic<any[]>, renderIndex: RenderIndex) {
      const nodes: JSXNode[] = []
      if (!list) return nodes;

      let index = 0
      while (index < list.length) {
         const $item = Ion(() => list[index])
         const kit = new IndexKit(list, $item, index, renderIndex, this.flask)
         nodes.push(kit)
         index++
      }
      return nodes;
   }
}


class IndexKit extends VineNode {
   flask: Flask

   constructor(
      public list: Ionic<any[]>,
      public $item: Ion<any>,
      public index: number,
      public render: RenderIndex,
      outerFlask: Flask
   ) {
      super()
      const flask = this.flask = outerFlask.spawn({ type: 'view', creationScope: true })
      this.nodes = processJSXOutput(this.render($item, index))
      flask.emitInitialMount()
   }
}


