import { template, FromTag, If, Else, For, fromGlobal, ContextKey, provideGlobal } from "@rue/lumo";
import { as, EACH, Ion, Ionic, Nested, } from "@rue/quarky";
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

function IonicTreeItem(item: TreeItemData | TreeItem) {
   if (item instanceof TreeItem) {
      return Ionic(item, { children: as(IonicChildren) })
   }
   return Ionic(new TreeItem(item.name, TreeChildren(item.children)), { children: as(IonicChildren) })
}

function IonicChildren(children: TreeItem[] | undefined): Ionic<IonicTreeItem[]> | undefined {
   if (!children) return undefined;
   return Ionic(children, {
      [EACH]: as(IonicTreeItem)
   })
}

function TreeChildren(children?: TreeItemData[]): TreeItem[] | undefined {
   return children?.map(item => new TreeItem(item.name, TreeChildren(item.children)))
}


// # Tree App

export function TreeApp() {
   const root = IonicTreeItem(getTreeItemData())

   console.log('root', root.children)

   return template(
      <>
         <ul style={{ width: '900px', backgroundColor: '#f6f6f6' }}>
            <TreeItemView item={root}></TreeItemView>
         </ul>
         <o--link href='/src/demos/tree-view.css' rel='stylesheet' />
      </>

   )
}


// # TreeItem

function TreeItemView(input: FromTag<{
   item: IonicTreeItem
}>) {
   const { item } = input

   const $isFolder = Ion(() => !!item.children?.length)
   const $isOpen = Ion($isFolder(), {
      toggle() {
         this.value = !this.value
      }
   })

   function changeType() {
      console.log('change type')
      if (!$isFolder()) {
         item.children = IonicChildren([])
         item.addChild(IonicTreeItem({ name: 'stuff' }))
         $isOpen.value = true
      }
   }


   return template(
      <li class='item'>
         <div
            class={($isFolder() && 'bold')}
            on:click={e => $isOpen.toggle()}
            on:dblclick={changeType}
         >
            {item.$name}
            {If($isFolder,
               <span>[{($isOpen() ? '-' : '+')}]</span>
            )}
         </div>
         {If($isFolder,
            <ul display-if={$isOpen}>
               {For(item.children!, m => m, item => (
                  <TreeItemView item={item}></TreeItemView>
               ))}
               <li class='add' on:click={e => item.addChild(IonicTreeItem({ name: 'stuff' }))}>+</li>
            </ul>
         )}
      </li>
   )
}


