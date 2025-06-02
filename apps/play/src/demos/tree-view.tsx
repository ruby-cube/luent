import { component, fromTag, Ionized, If, Else, For, v, Nonlocal, _Nonlocal } from "@rue/lumo";
import { ion, ionize, toRaw } from "@rue/quarky";
import { Inert, withInertItems } from "../../../../packages/quarky/src/ionized/inert";




const list = withInertItems(new Map([['hi', { nom: true }]]))

export function TreeApp() {

   const treeData = {
      name: 'My Tree',
      children: [
         // { name: 'hello' },
         // { name: 'hello' },
         // { name: 'world' },
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

   const treeItem = ionize(createTreeItem(treeData), {})

   return component((
      TreeItem = TreeItemView
   ) =>
      <>
      <ul style={{ width: '900px', backgroundColor: '#f6f6f6' }}>
         <TreeItem mu:item={treeItem}></TreeItem>
      </ul>
      <$--link href='/src/demos/tree-view.css' rel='stylesheet'/>
      </>

   )
}


function mutable(arg: any) { return arg }


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

type ItemData = {
   name: string,
   children?: ItemData[],
   child?: ItemData,
}

// const iven: DeepReadonly<ItemData> = {name: 'iven'}
// const iven2: _Nonlocal<ItemData> = { name: 'iven' }

// const chi = iven.children
// const ch2 = chi!.children

// type ItemData2 = {
//    readonly name: string,
//    readonly children?: DeepReadonly<ItemData[]>
// }

// type ItemData = {
//    readonly name: string;
//    readonly children?: readonly {
//        readonly name: string;
//        readonly children?: readonly {
//            readonly name: string;
//            readonly children?: readonly {
//                readonly name: string;
//                readonly children?: readonly {
//                    readonly name: string;
//                    readonly children?: readonly {
//                        readonly name: string;
//                        ...

class TreeItem {
   constructor(
      public name: string,
      public children?: TreeItem[],
   ) { }

   addChild() {
      console.trace('adding child')
      const children = this.children || (this.children = [])
      console.log(this, children)
      children.push(new TreeItem('new stuff'))
   }
}





function createTreeItem(data: ItemData): TreeItem {
   return new TreeItem(
      data.name,
      data.children?.map(child => createTreeItem(child))
   )
}

// function createTreeItem(data: ItemData) { 
//    return {
//       name: data.name,
//       children: data.children?.map(child => createTreeItem(child)), //NOTE: THIS PRODUCES CIRCULAR TYPE ERRORS, and requires writing the type, therefore prefer class syntax
//       addChild() {
//          const children = this.children || (this.children = [])
//          children?.push(new TreeItem({ name: 'new stuff' }))
//       }
//    }
// }


const textarea = document.createElement('textarea')

function TreeItemView(input = fromTag({
   'mu:item': Ionized<TreeItem>,
   // list: v<string[]>,
   // 'on:click': v<(e: { pen: string }) => void>('?')
})) {
   const { item } = input

   // item.children
   // emit('click', { pen: 'hi' })
   // const item = ionize({...data}, {
   //    addChild() {
   //       console.log('adding child')
   //       const children = item.children || (item.children = [])
   //       console.log(item, children)
   //       children.push({name: 'new stuff'})
   //    }
   // })

   const $isOpen = ion(!!item.children?.length, {
      toggle() {
         $isOpen.state = !$isOpen.state
      }
   })

   const $isFolder = ion(() => !!item.children?.length)

   function changeType() {
      if (!$isFolder()) {
         item.addChild()
         $isOpen.state = true
      }
   }

   return component((
      TreeItem = TreeItemView
   ) =>
      <li class='item'>
         <div
            class={{ 'bold': ($isFolder() && $isOpen()) }}
            on:click={$isOpen.toggle} on:dblclick={changeType}
         >
            {item.$name}
            {If($isFolder,
               <span>[{($isOpen() ? '-' : '+')}]</span>
            )}
         </div>
         {If($isFolder, 'create', If($isOpen, 'mount',
            <ul>
               {For(item.children!, m => m, item => (
                  <TreeItem mu:item={item}></TreeItem>
               ))}
               <li class='add' on:click={e => item.addChild()}>+</li>
            </ul>
         ))}
      </li>
   )
}


