import { component, fromTag, Ion, Ionized, $if, $else, $for, watch, } from "@rue/lumo";
import { ion, ionize, Phase, toRaw } from "@rue/quarky";
import { MountIf } from "../TestMountIf";



export function TreeApp() {

   const treeData = {
      name: 'My Tree',
      children: [
         { name: 'hello' },
         { name: 'world' },
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
      <ul style={{ width: '900px', backgroundColor: '#f6f6f6' }}>
         {/* <MountIf></MountIf> */}
         <TreeItem item={mutable(treeItem)}></TreeItem>
      </ul>
   )
}

function mutable(arg: any) { return arg }

type ItemData = {
   name: string,
   children?: ItemData[]
}

class TreeItem {
   constructor(
      public name: string,
      public children: TreeItem[] = []
   ) { }

   addChild() {
      console.log('adding child')
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
   item: Ionized<TreeItem>
})) {
   const { item } = input

   const $isOpen = ion(!!item.children?.length, {
      toggle() {
         $isOpen.value = !$isOpen.value
      }
   })

   const $isFolder = ion(() => !!item.children?.length)

   function changeType() {
      if (!$isFolder()) {
         item.addChild()
         $isOpen.value = true
      }
   }
   // watch(()=>item.children, ()=>{
   //    console.log('changed!')
   // })

   return component((
      TreeItem = TreeItemView
   ) =>
         <li class='item'>
            <div
               class={[$s = $isFolder() && 'bold']}
               on:click={$isOpen.toggle} on:dblclick={changeType}
            >
               {item.name}
               {$if($isFolder,
                  <span>[{$isOpen() ? '-' : '+'}]</span>
               )}
            </div>
            {$if($isFolder, 'create', $if($isOpen, 'mount',
               <ul>
                  {$for(item.children, item => item, (item) => (
                     <TreeItem item={item}></TreeItem>
                  ))}
                  <li class='add' on:click={() => item.addChild()}>+</li>
               </ul>
            ))}
         </li>
   )
}


