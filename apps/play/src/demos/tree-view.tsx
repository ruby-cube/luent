import { component, FromTag, If, Else, For, fromGlobal, CommonsKey } from "@rue/lumo";
import { $from, defineDeepIonize, EACH, Ion, ion, Ionic, ionize, IonizeBy, Ionized, NoExpand } from "@rue/quarky";


type DeepIonic<D extends (...args: any[]) => any, M = {}> = Omit<ReturnType<D>, keyof M> & M


function asGlobal<T>(value: T) {
   const key = CommonsKey('global')
   function $GlobalValue(): T {
      const _value = fromGlobal(key) ?? provideGlobal(key, value);
      return _value
   }

   return [$GlobalValue, key] as const
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

// # data
type TreeItemData = {
   name: string,
   children?: TreeItemData[]
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

   isFolder(this: ShallowRO<TreeItem>) {
      return !!this.children?.length
   }
}




type PickKeys<T, K extends keyof T> = K

type ShallowRO<T> = { readonly [K in keyof T]: T[K] }

type IsFullyReadonly<T> =
   keyof T extends never
   ? false // empty object, treat as not readonly
   : { [K in keyof T]-?: IfEquals<
      { [P in K]: T[P] },
      { -readonly [P in K]: T[P] },
      false,
      true
   > }[keyof T] extends true ? true : false

type IfEquals<X, Y, A = true, B = false> =
   (<T>() => T extends X ? 1 : 2) extends
   (<T>() => T extends Y ? 1 : 2) ? A : B;


type ROMethods<T> = { [K in keyof T as  T[K] extends Function ? T[K] extends (this: infer H, ...args: any[]) => any ? IsFullyReadonly<H> extends true ? K : never : never : never]: T[K] }

type Hey = ROMethods<TreeItem>


// # rich model from data
function createTreeItem(data: TreeItemData): TreeItem {
   const TreeItem = $GlobalTreeItem()
   return new TreeItem(
      data.name,
      data.children?.map(data => createTreeItem(data))
   )
}


// # ionic factory
function IonicTreeItem(data: TreeItemData): IonicTreeItem {
   return ionizeTreeItem(createTreeItem(data))
}


// # ionic type
type IonicTreeItem = DeepIonic<typeof ionizeTreeItem, {
   addChild(item: IonicTreeItem): void,
}>


// # deep ionize
const ionizeTreeItem = defineDeepIonize((_: TreeItem) => ({
   nested: {
      children: ionizeChildren
   }
}))

// # global class (DI)
export const [$GlobalTreeItem, TREE_ITEM_CLASS] = asGlobal(TreeItem)



const ionizeChildren = defineDeepIonize((_: TreeItem[]) => ({
   nested: [ionizeTreeItem]
}))



// # Tree App

export function TreeApp(input: FromTag<{
   data?: TreeItemData
}>) {
   const { data = getTreeItemData() } = input

   data.name = 'hi'

   const root = IonicTreeItem(data)

   return component(
      <>
         <ul style={{ width: '900px', backgroundColor: '#f6f6f6' }}>
            <TreeItemView item={root}></TreeItemView>
         </ul>
         <o--link href='/src/demos/tree-view.css' rel='stylesheet' />
      </>

   )
}

function Counter() {
   const $count = Ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   const frog = ionize({ name: 'kermit', age: NaN })

   return component(
      <Child mu:count={$count}></Child>
   )
}

type Readonly<T> =
   T extends (infer I)[] ? readonly MaybeReadonly<I>[] & T
   : T extends Set<infer I> ? Set<MaybeReadonly<I>>
   : { readonly [K in keyof T as T[K] extends Function ? T[K] extends { '~can'?: true } ? K : never : K]: T[K] }

type MaybeReadonly<T> = T extends object ? Readonly<T> : T


type Frog = { name: string, age: number, qualities: { brave: boolean }[] }
type Qualities = { brave: boolean }

// type Mu<T extends object, M extends keyof T, N = {}> = { [K in keyof T as K extends keyof M ? M[K] extends 'mu' ? K : never : never]: T[K] }

function Child(input: FromTag<{
   'mu:count': Ion<number> & { increment: () => void },
   // 'mu:frog': Frog
   // Mu<Frog, 'age', { qualities: Mu<Qualities[], 'brave'> }>
}>) {
   return component(
      <div></div>
   )
}

// type ReadonlyExcludeMu<T, M extends keyof T, N> = { readonly [K in Exclude<keyof T, keyof N> as T[K] extends Function ? never : K extends M ? never : K]: T[K] }
// type Muonly<T, M extends keyof T, N> = { [K in Exclude<keyof T, keyof N> as K extends M ? K : never]: T[K] }
// type ShallowMu<T, M extends keyof T> = ReadonlyExcludeMu<T, M> & Muonly<T, M>


type Mu<T extends object, M extends keyof T, N = {}> =
   { readonly [K in keyof T as T[K] extends Function ? never : K extends M ? never : K]: K extends keyof N ? N[K] : T[K] }
   & { [K in keyof T as K extends M ? K : never]: K extends keyof N ? N[K] : T[K] } // mutable or allowed methods
   & { '~mu'?: true }

type MuonicTreeItem = Mu<IonicTreeItem, 'addChild' | 'children', {
   children?: MuonicTreeItem[]
}>

const list = [1] as readonly number[]

type ReadonlyObj = { readonly [key: PropertyKey]: string }

type Obj = { [key: PropertyKey]: string }

type Yes = ReadonlyObj extends Obj ? true : false

// # TreeItem

function TreeItemView(input: FromTag<{
   'mu:item': Mu<IonicTreeItem, 'addChild' | 'children', { children?: MuonicTreeItem[] }>,
}>) {
   const { item } = input()

   const $isFolder = ion(() => !!item.children?.length)
   const $isOpen = ion($isFolder(), {
      toggle() {
         this.value = !this.value
      }
   })

   function changeType() {
      if (!$isFolder()) {
         item.children = ionizeChildren([])
         item.addChild(IonicTreeItem({ name: 'stuff' }))
         $isOpen.value = true
      }
   }

   return component(
      <li class='item'>
         <div
            class={{ 'bold': $isFolder }}
            on:click={$isOpen.toggle}
            on:dblclick={changeType}
         >
            {(item.name)}
            {If($isFolder,
               <span>[{($isOpen() ? '-' : '+')}]</span>
            )}
         </div>
         {If($isFolder,
            <ul show-if={$isOpen}>
               {For(item.children!, m => m, item => (
                  <TreeItemView mu:item={item}></TreeItemView>
               ))}
               <li class='add' on:click={e => item.addChild(IonicTreeItem({ name: 'stuff' }))}>+</li>
            </ul>
         )}
      </li>
   )
}


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