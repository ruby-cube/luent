import { $_run_with_, $_snap_context, ContextSnapshot, FLASK, Flask, getFlask } from "@rue/flask";
import { MaybeIon } from "../component/Input";
import { normalizeToRenderFunction, RawJSXNode } from "../node/makeJSXNode";
import { ListItemKit, ListKit, toAsyncRenderItem } from "./ItemList";
import { Ion, Ionic, IonizeBy, isGetter, isInertIon, isIon, IsIonic, isIonicProxy, MaybeIonize, toIon, toValue } from "@rue/quarky";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { ForIndex, IndexedListKit } from "./IndexedList";
import { isObject } from "@rue/utils";


export type RenderItem<L> =
   L extends Ion<infer D> ? D extends Collection<infer I> ? (item: IonizeBy<D, I>, $i: Ion<number>) => RawJSXNode : 'frog'
   : IsIonic<L> extends true ? L extends { [key: number]: infer I } ? (item: MaybeIonize<I>, $i: Ion<number>) => RawJSXNode : 'frog' // TODO: Sets and maps?
   : L extends Collection<infer I> ? (item: IonizeBy<L, I>, $i: Ion<number>) => RawJSXNode
   : (item: any, $i: Ion<number>) => RawJSXNode
// L extends Collection<infer I> | Ion<Collection<infer I>> ? ((item: I) => JSXNode) | ((item: I, $index: AtomicIon<number>) => JSXNode)
// : L extends Collection<infer I> ? ((item: I) => JSXNode) | ((item: I, index: number) => JSXNode)
// : never
// type ListData = AnyObject | any[] | Set<any> | Map<any, any> | Ionized<AnyObject[] | Set<any> | Map<any, any> | AnyObject> // TODO: Implement for maps, sets, and objects. Not sure about updating behavior. What about strings and iterating over characters?
export type ListData<T = any> = MaybeIon<Collection<T>>
export type UniqueItem = any;
export type Collection<T> = MaybeIon<T[]>
// | MaybeIon<Set<T>> | MaybeIon<Map<T>> // TODO: add maps


// TODO: account for list ion having undefined state
// TODO: Ionized item depending on if data is reactive
// TODO: $index: number | AtomicIon<number> based on whether list data is reactive
// export function For<L extends any[]>(data: L, render: ((item: L extends (infer I)[]? I : never, $index: Ion<number>)=>JSXNode) | JSXNode): ListRenderKit {
export function For<L extends ListData>(data: L, render: RenderItem<L>): ListKit | undefined | RawJSXNode
export function For<L extends ListData>(data: L, getUID: L extends Collection<infer T> ? (item: T) => unknown : (item: any) => unknown, render: RenderItem<L>): ListKit | undefined | RawJSXNode
export function For<L extends ListData>(data: L, renderOrGetUID: RenderItem<L> | (L extends Collection<infer T> ? (item: T) => unknown : never), render?: RenderItem<L>): ListKit | undefined | RawJSXNode {
   const uidProvided = arguments.length === 3
   const _render = normalizeToRenderFunction(uidProvided ? render! : renderOrGetUID) as RenderItem<any[]>;
   if (isGetter(data) || isIonicProxy(data) && isIterable(data)) {
      if (uidProvided) {
         return new ListKit(toIon(data), toAsyncRenderItem(_render), renderOrGetUID as (item: unknown) => unknown, getFlask())
      }
      return ForIndex(data, toAsyncRenderItem(_render))
      // new IndexedListKit(/* TODO: */ data as Ionic<any[]>, data.$length as Ion<number>, toAsyncRenderItem(_render), getFlask())
   }
   else {
      console.log('render static list')
      return renderStaticList(data, _render)
   }
}

function isIterable(data: any) {
   return Symbol.iterator in data
}



function renderStaticList(data: undefined | unknown[] | Set<unknown> | Map<unknown, unknown>, render: (item: unknown, index: number) => RawJSXNode) {
   if (!data) return;
   const array = normalizeToArray(data)
   const renderedList = []
   for (let i = 0; i < array.length; i++) {
      renderedList.push(render(array[i], i))
   }
   return renderedList
}

function normalizeToArray(data: unknown[] | Set<unknown> | Map<unknown, unknown>) {
   if (Array.isArray(data)) return data;
   if (Symbol.iterator in data)
      return Array.from(data)
   return Object.keys(data)
}


