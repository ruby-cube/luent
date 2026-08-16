import { component, template, FromTag, If, Else, For, fromGround, ContextKey, provideGround, $of } from "luent";
import { as, ionic, EACH, ion, Ionic, Nested, } from "@luent/quarky";
import "./style.css"
import "./TestTreeApp.css"

// # data
type TreeItemData = {
   name: string,
   children?: TreeItemData[]
}

function getTreeItemData(): TreeItemData {
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


// # class

class TreeItem {
   constructor(
      public name: string,
      public children?: TreeItem[]
   ) { }

   addChild(item: TreeItem) {
      this.children?.push(item)
   }
}

// # Ionizers

type IonicTreeItem = Ionic<TreeItem, Nested<{ children: Ionic<IonicTreeItem[]> | undefined }>>

function ionicTreeItem(item: TreeItemData | TreeItem) {
   function TreeChildren(children?: TreeItemData[]): TreeItem[] | undefined {
      return children?.map(item => new TreeItem(item.name, TreeChildren(item.children)))
   }

   return ionic(item, {
      '-wrap': item => item instanceof TreeItem ? item : new TreeItem(item.name, TreeChildren(item.children)),
      children: { '-as': ionicChildren }
   })
}


function ionicChildren(children: TreeItem[] | undefined): Ionic<IonicTreeItem[]> | undefined {
   if (!children) return undefined;
   return ionic(children, {
      [EACH]: { '-as': ionicTreeItem }
   })
}




// # Tree App

export function TreeApp() {
   const root = ionicTreeItem(getTreeItemData())

   console.log('root', root.children)

   return (

      <>
         <ul style={{ width: '900px', 'background-color': '#f6f6f6' }}>
            <TreeItemView mu:item={root}></TreeItemView>
         </ul>
         <o-link href='/src/demos/tree-view.css' rel='stylesheet' />
      </>

   )
}


// # TreeItem

function TreeItemView(input: {
   'mu:item': IonicTreeItem
}) {
   const { mu, item } = input

   const $isFolder = ion(() => !!item.children?.length)
   const $isOpen = ion($isFolder(), {
      toggle() {
         this.value = !this.value
      }
   })

   function changeType() {
      console.log('change type')
      if (!$isFolder()) {
         item.children = ionicChildren([])
         mu.item.addChild(ionicTreeItem({ name: 'stuff' }))
         $isOpen.value = true
      }
   }

   return (

      <li class='item'>
         <div
            class={($isFolder() && 'bold')}
            on:click={e => $isOpen.toggle()}
            on:dblclick={changeType}
         >
            {$of(item).name}
            {If($isFolder,
               <span>[{($isOpen() ? '-' : '+')}]</span>
            )}
         </div>
         {If($isFolder,
            <ul display-if={$isOpen}>
               {For(item.children!, m => m, item => (
                  <TreeItemView item={item}></TreeItemView>
               ))}
               <li class='add' on:click={e => mu.item.addChild(ionicTreeItem({ name: 'stuff' }))}>+</li>
            </ul>
         )}
      </li>
   )
}


