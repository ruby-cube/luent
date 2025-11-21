import { $_run_with_, $_snap_context, ContextSnapshot, FLASK, Flask } from "@rue/flask";
import { DOMNode, JSXNode, mountDOMNodes, mountFragment, processJSXOutput, removeDOMNodes, setUpNodeVine, VineNode } from "../node/VineNode";
import { Ion, ionic, MaybeIonized, MutableIon, queueInternalRender, watchToRender } from "@rue/quarky";
import { RenderItem } from "./For";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";

type UID = unknown

export type $Index = MutableIon<number> & { dataLength: number }
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
      this.nodes = this.render($list(), renderItem);
      watchToRender($list, ({ current: newList }) => {
         this.nodes = this.rerender(newList, renderItem)
      })
   }

   prevItems: Map<UID, ListItemKit> = new Map()

   private render(list: unknown[], renderItem: RenderItem<unknown>) {
      const nodes: JSXNode[] = []
      for (let i = 0; i < list.length; i++) {
         const item = list[i]
         const $index = Ion(i, { dataLength: list.length })
         const kit = new ListItemKit(item, $index, renderItem, this.flask)
         nodes.push(kit)
         this.prevItems.set(this.getUID(item), kit)
      }
      return nodes;
   }

   private rerender(list: unknown[], renderItem: RenderItem<unknown>) {
      console.log('rerendering list') // FIX: Why is this running twice?
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
            kit.$index.value = i
            kit.$index.dataLength = list.length;
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
            const $index = Ion(i, { dataLength: list.length })
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

      console.log('$$$@ lcsStart', lcsStart)
      console.log('$$$@ lcsLength', lcsLength)
      console.log('$$$@ sequences', sequences)

      queueInternalRender(() => {
         console.log('qIR rerendering list')
         // TODO: Can we make this call more efficient??
         // remove DOMNodes
         let i = prevKits.length;
         while (i--) {
            const kit = prevKits[i]
            const uid = this.getUID(kit.item)
            if (!currentItems.has(uid)) {
               kit.$index.value = -1;
               kit.$index.dataLength = list.length;
               const prevNodes = kit.nodes!
               removeDOMNodes(prevNodes)
               kit.nodes = undefined;
               kit.flask.emitDiscard()
            }
            else if (hasMoved(kit)) {
               const prevNodes = kit.nodes!
               removeDOMNodes(prevNodes)
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
               mountFragment(fragment, precedingLeaf, this.parent)
            }
         }
      }, this.flask)

      this.prevItems = currentItems
      return kits;
   }
}

export function toAsyncRenderItem(renderItem: RenderItem<unknown>, context: ContextSnapshot = $_snap_context(), trace = __DEV__ ? __DEV__buildAsyncPath() : '') {
   return function render(this: ListItemKit, item: unknown, $index: Ion<number>) {
      return $_run_with_(context, () => renderItem(item, $index), {
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
      public render: RenderItem<unknown>,
      outerFlask: Flask
   ) {
      super()
      const flask = this.flask = outerFlask.spawn({ type: 'view', creationScope: true })
      this.nodes = processJSXOutput(this.render(item, Ion(() => $index())))
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
//          watchToRender(){

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
