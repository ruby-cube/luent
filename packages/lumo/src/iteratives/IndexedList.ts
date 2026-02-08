import { $_derivation, Ion, Ionic, isIonicProxy, PRELUDE, queueInternalRender, SYNC, toRaw, toValue, watch, watchToRender } from "@rue/quarky";
import { MaybeIon } from "../component/Input";
import { AnyObject } from "@rue/types";
import { RawJSXNode } from "../node/makeJSXNode";
import { DOMNode, JSXNode, mountDOMNodes, mountFragment, processJSXOutput, removeDOMNodes, VineNode } from "../node/VineNode";
import { Flask, getActiveFlask, getFlask } from "@rue/flask";
import { quarkOf } from "../../../quarky/src/abstract/Quark";

export type Nullish = null | undefined

export type RenderIndex = ($item: Ion<any>, index: number) => RawJSXNode

export function ForIndex(input: MaybeIon<AnyObject | Nullish>, renderIndex: RenderIndex) {
   const ionicList = isIonicProxy(input) && input instanceof Array ? input as any as Ionic<any[]> : Ionic([])
   const removedIndices = new Set()
   function reconcile(ionicList: any[], newList: any[]) {
      for (let i = 0; i < newList.length; i++) {
         const item = newList[i]
         const oldItem = ionicList[i]
         if (item !== oldItem) {
            ionicList[i] = item
         }
      }
      if (newList.length < ionicList.length) {
         console.log('### removing item')
         for (let i = newList.length; i < ionicList.length; i++) {
            console.log('adding removed index', i)
            removedIndices.add(i)
         }
         ionicList.splice(newList.length, ionicList.length - newList.length)
         console.log('### item removed')
      }
   }

   const $length = Ion(() => ionicList.length ?? 0)

   const flask = getFlask()

   watch(input, ({ current, previous }) => {
      if (ionicList === input) {
         return;
      }
      if (!current) {
         ionicList.length = 0
         return ionicList;
      }
      const newArray = current instanceof Array ? current : Symbol.iterator in current ? Array.from(current as ArrayLike<any>) : Object.keys(current)
      reconcile(ionicList, newArray)
   }, { eager: true, phase: PRELUDE })

   return new IndexedListKit(ionicList, $length, renderIndex, flask, removedIndices,
      toValue(input) instanceof Map ? ($entry: Ion<any>) => {
         const $key = Ion(() => $entry()?.[0]);
         const $value = Ion(() => toValue(input)?.get($key()))
         return [$key, $value]
      } : undefined)
}

export class IndexedListKit extends VineNode {

   constructor(
      public list: Ionic<any[]>,
      $length: Ion<number>,
      public renderIndex: RenderIndex,
      public flask: Flask,
      public removedIndices = new Set(),
      private transformItem?: ($item: Ion<any>) => any
   ) {
      super()
      this.nodes = this.render(list, renderIndex) as IndexKit[];

      // TODO: do this work in reconcile instead?
      watchToRender($length, ({ current, previous }) => {
         const kits = this.nodes as IndexKit[]
         if (current > previous) {
            let preceding = kits[previous - 1] ?? this.preceding
            const fragment: DocumentFragment | null = new DocumentFragment()
            for (let i = previous; i < current; i++) {
               let cache: any;
               const $item = Ion(() => {
                  if (removedIndices.has(i)) {
                     removedIndices.delete(i)
                     console.log('returning cache', cache)
                     return cache
                  }
                  else {
                     console.log('returning item', list[i])
                     return cache = list[i]
                  }
               })

               // const $item = Ion(() => (i in quarkOf(list).state.get() ? (console.log("### reading $item", list[i]), cache = list[i]) : (console.log("USING CACHED"), cache)))
               const item = transformItem ? transformItem($item) : $item
               const kit = new IndexKit(list, item, i, renderIndex, this.flask)
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

      let i = 0
      while (i < list.length) {
         let cache: any;
         const $item = Ion(() => {
            if (this.removedIndices.has(i)) {
               this.removedIndices.delete(i)
               console.log('returning cache', cache)
               return cache
            }
            else {
               console.log('returning item', list[i])
               return cache = list[i]
            }
         })
         // const $item = Ion(() => (i in quarkOf(list).state.get() ? (console.log("### reading $item", list[i]), cache = list[i]) : (console.log("USING CACHED"), cache)))
         // const $item = Ion(() => (this.removedIndices.has(i) ? (this.removedIndices.delete(i), cache) : (console.log("### reading $item"), cache = list[i])))
         const item = this.transformItem ? this.transformItem($item) : $item
         const kit = new IndexKit(list, item, i, renderIndex, this.flask)
         nodes.push(kit)
         i++
      }
      return nodes;
   }
}


class IndexKit extends VineNode {
   flask: Flask

   constructor(
      public list: Ionic<any[]>,
      public item: any,
      public index: number,
      public render: RenderIndex,
      outerFlask: Flask
   ) {
      super()
      const flask = this.flask = outerFlask.spawn({ type: 'view', creationScope: true })
      this.nodes = processJSXOutput(this.render(item, index))
      flask.emitInitialMount()
   }
}


