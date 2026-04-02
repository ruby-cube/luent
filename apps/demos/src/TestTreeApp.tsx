import { template, FromTag, If, Else, For, fromGround, ContextKey, provideGround } from "@rue/lumo";
import { as, asIonic, EACH, Ion, Ionic, Nested, } from "@rue/quarky";
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

function asIonicTreeItem(item: TreeItemData | TreeItem) {
   if (item instanceof TreeItem) {
      return asIonic(item, {
         children: { '-as': asIonicChildren }
      })
   }
   return asIonic(new TreeItem(item.name, TreeChildren(item.children)), {
      children: { '-as': asIonicChildren }
   })
}

function asIonicChildren(children: TreeItem[] | undefined): Ionic<IonicTreeItem[]> | undefined {
   if (!children) return undefined;
   return asIonic(children, {
      [EACH]: { '-as': asIonicTreeItem }
   })
}

function TreeChildren(children?: TreeItemData[]): TreeItem[] | undefined {
   return children?.map(item => new TreeItem(item.name, TreeChildren(item.children)))
}


// # Tree App

export function TreeApp() {
   const root = asIonicTreeItem(getTreeItemData())

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
         item.children = asIonicChildren([])
         item.addChild(asIonicTreeItem({ name: 'stuff' }))
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
            {item.æname}
            {If($isFolder,
               <span>[{($isOpen() ? '-' : '+')}]</span>
            )}
         </div>
         {If($isFolder,
            <ul show-if={$isOpen}>
               {For(item.children!, m => m, item => (
                  <TreeItemView item={item}></TreeItemView>
               ))}
               <li class='add' on:click={e => item.addChild(asIonicTreeItem({ name: 'stuff' }))}>+</li>
            </ul>
         )}
      </li>
   )
}


