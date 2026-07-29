import { $_run_with_, $_snap_context, ContextSnapshot, FLASK, Flask } from "@luent/flask";
import { DOMNode, JSXNode, mountDOMNodes, mountFragment, processJSXOutput, removeDOMNodes, setUpNodeVine, VineNode } from "../node/VineNode";
import {createAtomicIon, Ion, MaybeIonized, MutableIon, atRender, trackForRender, atInternalRender } from "@luent/quarky";
import { RenderItem } from "./For";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { RawJSXNode } from "../node/makeJSXNode";
import { createStack } from "@luent/utils";
import { unmarkInitialRender, markInitialRender } from "../transitions/transitions";

type UID = unknown

export type $Index = MutableIon<number>
// let currentItem: any;
// let $currentIndex: Ion<number> | undefined;

// export function getCurrentIndex(): Ion<number> | undefined {
//    return $currentIndex
// }

// export function setCurrentIndex($index: Ion<number> | undefined) {
//    // currentItem = item;
//    $currentIndex = $index;
// }



export class ListKit extends VineNode {

   constructor(
      public $list: Ion<MaybeIonized<unknown[]>>,
      public renderItem: RenderItem<unknown>,
      public getUID: (item: unknown) => UID,
      public flask: Flask
   ) {
      super()
      try {
         markInitialRender(true)
         this.nodes = this.render($list(), renderItem);
      }
      finally {
         unmarkInitialRender()
         trackForRender($list, ({ current: newList }) => {
            this.nodes = this.rerender(newList, renderItem)
         })
      }
   }

   prevItems: Map<UID, ListItemKit> = new Map()

   private render(list: unknown[] | undefined, renderItem: RenderItem<unknown>) {
      if (!list) return [];
      try {
         markInitialRender(true)
         const kits: ListItemKit[] = []
         for (let i = 0; i < list.length; i++) {
            const item = list[i]
            const $index = createAtomicIon(i)

            const kit = new ListItemKit(item, $index, renderItem, this.flask)
            kits.push(kit)
            this.prevItems.set(this.getUID(item), kit)
         }
         return kits;
      }
      finally {
         unmarkInitialRender()
      }
   }

   private rerender(list: unknown[] | undefined, renderItem: RenderItem<unknown>) {
      if (!list) list = []
      const prevItems = this.prevItems;
      const prevKits = this.nodes! as ListItemKit[];
      const kits: ListItemKit[] = []
      const currentItems = new Map()
      let hasNewItems = false
      let hasMovedItems = false
      let preceding = this.preceding;

      const sequences: { start: number, length: number }[] = []

      let lcsLength: number = 1;
      let lcsStart: number = 0;

      function updateLCS(seq: { start: number, length: number } | undefined) {
         if (seq && seq.length > lcsLength) {
            lcsLength = seq.length
            lcsStart = seq.start
         }
      }

      for (let i = 0; i < list.length; i++) {
         const item = list[i]
         const uid = this.getUID(item)
         let kit = prevItems.get(uid)

         // existing item
         if (kit) {
            console.log('&&& existing item!', item)
            const { $index } = kit
            $index.value = i
            if (kit.preceding !== preceding || i === 0) {
               updateLCS(sequences.at(-1))
               sequences.push({ start: i, length: 1 })
               kit.preceding = preceding
            }
            else {
               const seq = sequences.at(-1)!
               seq.length++
            }
         }
         // new item!
         else {
            console.log('&&& new item!', item)
            const $index = createAtomicIon(i)
            kit = new ListItemKit(item, $index, renderItem, this.flask)
            kit.parent = this.parent;
            kit.preceding = preceding;
            setUpNodeVine(kit.nodes!, this.parent!, preceding)
            hasNewItems = true;
         }

         kits.push(kit)
         currentItems.set(uid, kit)
         preceding = kit;
      }

      updateLCS(sequences.at(-1))

      // console.log('$$$@ lcsStart', lcsStart)
      // console.log('$$$@ lcsLength', lcsLength)
      // console.log('$$$@ sequences', sequences)

      // console.log('qIR rerendering list')
      // TODO: Can we make this call more efficient??

      // remove DOMNodes
      let i = prevKits.length;
      while (i--) {
         const kit = prevKits[i]
         const uid = this.getUID(kit.item)
         if (!currentItems.has(uid)) {
            const { $index } = kit
            $index.value = -1;
            atInternalRender(() => {
               const prevNodes = kit.nodes!
               removeDOMNodes(prevNodes)
               kit.nodes = undefined;
            })
            kit.flask.emitDiscard()
         }
         else if (hasMoved(kit)) {
            atInternalRender(() => {
               const prevNodes = kit.nodes!
               removeDOMNodes(prevNodes)
            })
            kit.hasMoved = true;
            hasMovedItems = true;
         }
      }

      function hasMoved(kit: ListItemKit) {
         if (inLongestSeq(kit.$index())) return false;
         // TODO: check if sequence is in correct order relative to lcs and other seqs
         return true
      }

      function inLongestSeq(index: number) {
         return index >= lcsStart && index < lcsLength
      }

      atInternalRender(() => {
         const fragments: { fragment: DocumentFragment, precedingLeaf: DOMNode | null }[] = []

         // mount to fragment
         if (hasNewItems || hasMovedItems) {
            let fragment: DocumentFragment | null = null

            for (let i = 0; i < kits.length; i++) {
               const kit = kits[i]
               if (!prevItems.has(kit) || kit.hasMoved) {
                  if (!fragment) {
                     fragments.push({ fragment: fragment = new DocumentFragment(), precedingLeaf: kit.precedingLeaf })
                  }
                  console.log('$$$ MOUNT TO FRAGMENT')
                  mountDOMNodes(kit.nodes!, fragment)
                  kit.hasMoved = null;
               }
               else {
                  fragment = null
               }
            }
         }

         if (fragments.length) {
            for (const { fragment, precedingLeaf } of fragments) {
               console.log('$$$ MOUNT FRAGMENT')
               mountFragment(fragment, precedingLeaf, this.parent)
            }
         }
      })

      this.prevItems = currentItems
      return kits;
   }
}

export function toAsyncRenderItem(renderItem: (item: unknown, index: unknown) => RawJSXNode, context: ContextSnapshot = $_snap_context(), trace = __DEV__ ? __DEV__buildAsyncPath() : '') {
   return function render(this: ListItemKit, item: unknown, index: unknown) {
      return $_run_with_(context, () => {
         return renderItem(item, index)
      }, {
         [FLASK]: this.flask,
         [TRACE]: trace
      })
   }
}

export class ListItemKit extends VineNode {
   flask: Flask
   hasMoved: undefined | null | boolean

   constructor(
      public item: unknown,
      public $index: $Index,
      public renderItem: RenderItem<unknown>,
      outerFlask: Flask
   ) {
      super()
      const flask = this.flask = outerFlask.spawn({ type: 'view', creationScope: true })
      this.nodes = processJSXOutput(this.renderItem(item, () => $index()))
      flask.emitInitialMount()
   }

   // mount() {
   //    setUpNodeVine(this.nodes!, this.parent!, this.preceding)
   //    const fragment = new DocumentFragment()
   //    mountDOMNodes(this.nodes!, fragment)
   //    queueInternalRender(() => {
   //       mountFragment(fragment, this.precedingLeaf, this.parent)

   //       kit.type === 'create' ? kit.flask!.emitInitialMount() : kit.flask!.emitRemount()
   //    })
   // }
}



// function makeList() {

//    const nodes = this.nodes = []
//    for (const item of list) {
//       nodes.push(makeListItem(item, index, render))
//    }

//    return {

//       setUp() {
//          trackForRender(){

//          }
//       },
//       mount() {
//          const nodes = this.nodes;
//          for (const item of nodes) {
//             item.mount()
//          }
//       }
//    }
// }

// function makeListItem() {

//    return {
//       setUp() {
//          const nodeEntities = this.nodeEntities = render()
//       },
//       mount,
//       unmount
//    }
// }
