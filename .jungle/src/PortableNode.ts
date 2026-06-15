import { Collection, For } from "@rue/luent"
import { AtomicIon, Ion, Ionized, ion } from "../../../packages/quarky/src"

class PortableNode {

    discard() {

    }

    unmount() {
        // remove listeners but preserve
    }

    mount() {
        // (re)setup listeners
    }
}



class ListPort<L extends any[] = any[]> {

    constructor(list: AtomicIon<L> | Ionized<L>, renderItem: RenderListItem<L>) {

    }

    // update(updater: (listData: L, nodeList: PortableItem<L extends (infer I)[] ? I : never>[]) => void) {

    // }
}

type RenderListItem<L extends any[]> = (item: L extends (infer I)[] ? I : never, $index: Ion<number>) => any

type ListPortType = string
type UID = string | number | symbol

const portableItemKeyMap: Map<ListPortType, UID> = new Map()

const renderPortableItemMap: Map<UID, () => any> = new Map()

// function $ListPort<L extends any[] = any[]>(listData: AtomicIon<L> | Ionized<L>, renderItem: RenderListItem<L>, UIDKey: string, config: { type: string, ref?: AtomicIon<PortableNode> }) {
//     const listRenderKit = For(listData as Collection<L extends (infer I)[] ? I : never>, renderItem, UIDKey)

//     return listRenderKit;
// }


// const $records_list = $ListPort($records, (record) => (
//     <h1>{ record.content } </h1>
// ), 'id', { type: 'records', ref: $recordNodes }) // uid is required // ref is only needed if you want to be able to mount a morphic port, unmount, or destory

// function changeMainContent(index) {
//     $main_content.as($bye)
// }

// function asData<T>(portableItem: PortableItem<T>) {
//     return portableItem as T;
// }





// onCreated()

// onDiscard()

// onMount()

// beforeDetach()

// onUnmounted



