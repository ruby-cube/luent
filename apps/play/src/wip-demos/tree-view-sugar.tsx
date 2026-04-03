//@ts-nocheck
import { template, FromTag, If, Else, For } from "@rue/luent";
import { $from, defineDeepIonize, EACH, ion, Ionic, ionize, Ionized } from "@rue/quarky";


function getTreeData(): TreeItem {
   return {
      name: 'My Tree',
      children: [
         {
            name: 'child folder',
            children: [
               {
                  name: 'child folder',
                  children: [{ name: 'hello' }, { name: 'world' }]
               },
               { name: 'hello' },
               { name: 'world' },
               {
                  name: 'child folder',
                  children: [{ name: 'hello' }, { name: 'world' }]
               }
            ]
         }
      ]
   }
}


// # Ionic Def

interface TreeItem {
   name: string
   children?: TreeItem[]
}

type IonicTreeItem = ReturnType<typeof ionizeItem>

const ionizeItem = defineDeepIonize((_: TreeItem) => ({
   nested: {
      children: ionizeItems
   }
}))

const ionizeItems = defineDeepIonize((_: TreeItem[]) => ({
   nested: [ionizeItem]
}))

function addChildTo(item: IonicTreeItem) {
   item.children?.push(ionizeItem({
      name: 'new stuff',
      children: []
   }))
}



// # Tree App

export function TreeApp({ data = getTreeData() }) {

   const root = ionizeItem(data)

   return template(
      <>
         <ul style={{ width: '900px', backgroundColor: '#f6f6f6' }}>
            <TreeItem item={root} can:addChildTo={addChildTo}></TreeItem>
         </ul>
         <o--link href='/src/demos/tree-view.css' rel='stylesheet' />
      </>

   )
}


// # TreeItem

// function TreeItem(input: FromTag<{
//    item: IonicTreeItem,
//    'can:addChildTo': (item: IonicTreeItem) => void
// }>) {
//    const { item, addChildTo } = input

//    let isFolder = ion(() => !!item.children?.length)
//    let isOpen = ion(isFolder)

//    function toggle() {
//       isOpen = !isOpen
//    }

//    function changeType() {
//       if (!isFolder) {
//          item.children = ionizeItems([])
//          addChildTo(item)
//          isOpen = true
//       }
//    }

//    return template(
//       <li class='item'>
//          <div
//             class={{ 'bold': %(isFolder && isOpen) }}
//             on:click={toggle}
//             on:dblclick={changeType}
//          >
//             {%(item.name)}
//             {If(%isFolder,
//                <span>[{(%isOpen ? '-' : '+')}]</span>
//             )}
//          </div>
//          {If(%isFolder,
//             <ul show-if={%isOpen}>
//                {For(item.children!, m => m, item => (
//                   <TreeItem
//                      item={item}
//                      can:addChildTo={addChildTo}>
//                   </TreeItem>
//                ))}
//                <li class='add' on:click={e => addChildTo(item)}>+</li>
//             </ul>
//          )}
//       </li>
//    )
// }


// type DeepReadonly<T> = T extends object
//   ? T extends Function
//     ? T
//     : NestedDeepReadonly<T>
//   : T;

// type NestedDeepReadonly<T> = {
//   readonly [P in keyof T]: DeepReadonly<T[P]>;
// };

// type DeepReadonly<T> = T extends Object ? {
//    readonly [P in keyof T]: DeepReadonly<T[P]>;
// } : T




// type TreeItemIonicProperties = { children: { nested: TreeItemsIonicProperties } }

// type TreeItemsIonicProperties = { [key: number]: { nested: TreeItemIonicProperties } }

// const ionizeItem = defIonize(() => ({
//    nested: {
//       children: ionizeList
//    }
// }))

// const ionizeList = defIonize(() => ({
//    nested: [ionizeItem]
// }))


// const BBB = ionizeItem({} as TreeItem)

// const what = BBB.children![0].children![0].children![0].children![0].children


// type IonicTreeItem = Ionic<TreeItem, TreeItemIonicProperties>

// const tr: IonicTreeItem = {} as IonicTreeItem

// const a = tr.children![0].children![0].children!

// type IonicTreeItem = Ionic<{
//    name: string
//    children?: IonicTreeItem[]
// }>