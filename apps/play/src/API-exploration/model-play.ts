// normalize data
// model factory receives data

import { ion, ionic, ionize } from "@rue/quarky"
import { inert } from "../../../../packages/x-old/x_inert"


// state kit (to be destructured):      const { $list } = ListKit(listData)
// class that is ionizable:             const $list = ionize(new List(listData))

// class that is internally ionized:    const $list = new IonicList(listData)

// factory that is ionizable            const $list = ionize(List(listData))
// factory that is internally ionized   const $list = IonicList(listData)


// considerations
// - ergonomics
// - performance
// - memory


// performance comparison

// getter vs derivedIon vs propIon
const $frogWithGetter = ionize({
    get name() { return $asFroggy.name }
})

const $frogWithDerived = ionize({
    name: Ion(() =>$asFroggy.name)
})

const $frogWithPropIon = ionize({
    name: asPion($asFroggy, 'name')
})


type Id = string


function List(data: {
    itemIds: Id[]
}) {
    const items = revivePeas(ItemModel, data.itemIds)
    const asContentPod = ionize(new ContentPod(items)) // must ionize

    return inert(Capsule({
        // properties
        get items() {
            return asContentPod.content
        }
    }, {
        // methods that access private properties
        addItem(itemData: any) {
            asContentPod.insert(ItemModel(itemData))
        },
        removeItem(index: number) {
            return asContentPod.remove(index)
        },
        // methods on prototype
        ...methods
    }))
}


const methods = {
    isFrog(this: _List) {

    }
}

class List {
    
    constructor(data: { items: Id[] }) {
        const items = revive(data.items, ItemModel)
        this.asContentPod = new ContentPod(items) // must be registered as ionizable
    }
    
    private asContentPod: ContentPod // the ionize function will auto ionize

    get items() {
        return this.asContentPod.content;
    }

    insert(){
        return this.asContentPod.insert()
    }
}


const $dog = ionize({
    name: 'fido',
    id: 0,
    log: []
}, {
    setName(name: string) {
        $dog.name = name
    }
})



// class List {
//     constructor(data: { items: Id[] }) {

//     }
// }


function ItemModel(data: {
    tagIds: Id[]
    text: string,
    bullet: string
}) {

    const tags = revivePeas(Tags, data.tagIds)

    return {
        text: data.text
    }
}

function revivePeas(...args: any[]): any {

}
