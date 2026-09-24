import { createMemoizedDerivation, Ion, PRELUDE, awaitRender, SYNC, toRaw, toValue, observe, trackForRender, queueInternalRender } from "@luent/quarky";
import { AnyObject } from "@luent/types";
import { RawJSXNode } from "../node/makeJSXNode";
import { DOMNode, JSXNode, mountDOMNodes, mountFragment, processJSXOutput, removeDOMNodes, VineNode } from "../node/VineNode";
import { Flask, getActiveFlask, getFlask } from "@luent/flask";
import { markInitialRender, unmarkInitialRender } from "../transitions/transitions";

export type Nullish = null | undefined

export type RenderIndex = ($item: Ion<any>, index: number) => RawJSXNode

export function ForIndex(input: Ion<AnyObject | Nullish> | AnyObject, renderIndex: RenderIndex) {

   return new IndexedListKit(
      input,
      renderIndex,
      getFlask(),
      toValue(input) instanceof Map ? ($entry: Ion<any>) => {
         const $key = createMemoizedDerivation(() => $entry()?.[0]);
         const $value = createMemoizedDerivation(() => toValue(input)?.get($key()))
         return [$key, $value]
      } : undefined)
}

export class IndexedListKit extends VineNode {

   constructor(
      input: Ion<AnyObject | Nullish> | AnyObject,
      private renderIndex: RenderIndex,
      private flask: Flask,
      private transformItem?: ($item: Ion<any>) => any
   ) {
      super()
      const $list = createMemoizedDerivation(() => this.toArray(toValue(input)))
      let array = [...$list()]
      
      // NOTE: IMPORTANT: We must set up the observer BEFORE rendering
      // This ensure the order of reactions run in such a way that
      // there is no need for optional chaining $item().property
      // to avoid cannot read property of undefined when removing an item
      
      observe(input, ({ current }) => {
         this.reconcile(array, $list)
         array = [...$list()]
      }, { phase: PRELUDE })
      
      try{
         markInitialRender(true)
         this.nodes = this.render($list) as IndexKit[];
      }
      finally{
         unmarkInitialRender()
      }
   }

   toArray(input: AnyObject | Nullish) {
      if (!input) return []
      return Array.isArray(input) ? input : Symbol.iterator in input ? Array.from(input as Set<any>) : Object.keys(input)
   }

   private render($list: Ion<any[]>) {
      const nodes: JSXNode[] = []
      const listLength = $list().length
      let i = 0
      while (i < listLength) {
         nodes.push(this.createNewItem($list, i))
         i++
      }
      return nodes;
   }

   createNewItem($list: Ion<any[]>, index: number) {
      let cache: any;
      const $item = createMemoizedDerivation(() => {
         return $list()[index]
         // $list()
         // if (this.removedIndices.has(index)) {
         //    console.log('$$$ RETURN CACHE', index, $list()[index])
         //    this.removedIndices.delete(index)
         //    return cache
         // }
         // else {
         //    console.log('$$$ RETURN ITEM', index, $list()[index])
         //    return cache = $list()[index]
         // }
      })
      const item = this.transformItem ? this.transformItem($item) : $item
      return new IndexKit(item, index, this.renderIndex, this.flask)
   }

   reconcile(list: any[], $newList: Ion<any[]>) {
      const kits = this.nodes as IndexKit[]
      // const { removedIndices } = this

      const previousLength = list.length
      const length = $newList().length

      if (length > previousLength) {
         let preceding = kits[previousLength - 1] ?? this.preceding
         const fragment: DocumentFragment | null = new DocumentFragment()
         for (let i = previousLength; i < length; i++) {
            const kit = this.createNewItem($newList, i)
            kits.push(kit)
            kit.parent = this.parent;
            kit.preceding = preceding;
            mountDOMNodes(kit.nodes!, fragment)
         }
         queueInternalRender(() => {
            // mount to fragment
            mountFragment(fragment, kits[previousLength].precedingLeaf, this.parent)
         })
      }
      else if (length < previousLength) {
         // for (let i = length; i < previousLength; i++) {
         //    console.log('$$$ ADD REMOVED INDEX', i)
         //    removedIndices.add(i)
         // }
         // delete indexes
         const removed = kits.splice(length, previousLength - length)

         for (const kit of removed) {
            queueInternalRender(() => {
               removeDOMNodes(kit.nodes!)
               kit.nodes = undefined;
            })
            kit.flask.emitDiscard()
         }
      }
   }
}


class IndexKit extends VineNode {
   flask: Flask

   constructor(
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


