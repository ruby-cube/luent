import { $_run_with_, $_snap_context, ContextSnapshot, FLASK, Flask, getFlask } from "@rue/flask";
import { MaybeIon } from "../component/Input";
import { normalizeToRenderFunction, RawJSXNode } from "../node/makeJSXNode";
import { ListItemKit, ListKit, toAsyncRenderItem } from "./ItemList";
import { Ion, Ionic, IonizeBy, isGetter, isInertIon, isIon, IsIonic, isIonicProxy, toIon, toValue } from "@rue/quarky";
import { __DEV__buildAsyncPath, TRACE } from "../../../flask/debug";
import { ForIndex, IndexedListKit, Nullish } from "./IndexedList";
import { isObject } from "@rue/utils";
import { AnyObject } from "@rue/types";


// export type RenderItem<L> =
//    L extends Ion<infer D> ? D extends Collection<infer I> ? (item: IonizeBy<D, I>, $i: Ion<number>) => RawJSXNode : 'frog'
//    : IsIonic<L> extends true ? L extends { [key: number]: infer I } ? (item: MaybeIonize<I>, $i: Ion<number>) => RawJSXNode : 'frog' // TODO: Sets and maps?
//    : L extends Collection<infer I> ? (item: IonizeBy<L, I>, $i: Ion<number>) => RawJSXNode
//    : (item: any, $i: Ion<number>) => RawJSXNode


export type ListData = MaybeIon<AnyObject | Nullish>
export type UniqueItem = any;
export type Collection<T> = MaybeIon<T[]>

type GetKey<L> = L extends (infer I)[] ? (item: I) => unknown : never

type RenderDynamicIndex<L> = L extends (infer I)[] ? ($item: Ion<I>, index: number) => RawJSXNode
   : L extends Set<infer I> ? ($item: Ion<I>, index: number) => RawJSXNode
   : L extends Map<infer K, infer V> ? (entry: [Ion<K>, Ion<V>], index: number) => RawJSXNode
   : L extends object ? (key: keyof L, index: number) => RawJSXNode
   : never

type RenderItem<L> = L extends (infer I)[] ? (item: I, $index: Ion<number>) => RawJSXNode
   : never

type RenderStatic<L> = L extends (infer I)[] ? (item: I, index: number) => RawJSXNode
   : L extends Set<infer I> ? (item: I, index: number) => RawJSXNode
   : L extends Map<infer K, infer V> ? (entry: [K, V], index: number) => RawJSXNode
   : L extends object ? (key: keyof L, index: number) => RawJSXNode
   : (item: unknown, index: unknown) => RawJSXNode

type IsReactive<L> = L extends Ion<any> ? true : L extends { '~ionic': true } ? true : false

type RenderIndex<L> = IsReactive<L> extends false ? RenderStatic<L> : RenderDynamicIndex<ToValue<L>>

type ToValue<T> = T extends Ion<infer V> ? V : T


export function For<L, U>(data: L & MaybeIon<Ionic<any[]> | any[] | Nullish>, getKey: GetKey<ToValue<L>>, render: RenderItem<ToValue<L>>): ListKit | undefined | RawJSXNode
export function For<L, U>(data: L & ListData, render: RenderIndex<L>): ListKit | undefined | RawJSXNode
export function For<L, U>(data: L & ListData, renderOrGetUID: GetKey<ToValue<L>> | RenderIndex<L>, render?: RenderItem<ToValue<L>>): ListKit | undefined | RawJSXNode {
   if (!data) return;
   const uidProvided = arguments.length === 3
   const _render = normalizeToRenderFunction(uidProvided ? render! : renderOrGetUID);
   if (isGetter(data) || isIonicProxy(data) && isIterable(data)) {
      if (uidProvided) {
         return new ListKit(toIon(data), toAsyncRenderItem(_render), renderOrGetUID as (item: unknown) => unknown, getFlask())
      }
      return ForIndex(data, toAsyncRenderItem(_render))
   }
   else {
      return renderStaticList(data, _render)
   }
}

function isIterable(data: any) {
   return Symbol.iterator in data
}



function renderStaticList(data: undefined | unknown[] | Set<unknown> | Map<unknown, unknown> | AnyObject, render: (item: unknown, index: number) => RawJSXNode) {
   if (!data) return;
   const array = normalizeToArray(data)
   const renderedList = []
   for (let i = 0; i < array.length; i++) {
      renderedList.push(render(array[i], i))
   }
   return renderedList
}

function normalizeToArray(data: unknown[] | { [Symbol.iterator]: any } | ArrayLike<any> | object) {
   if (Array.isArray(data)) return data;
   if (Symbol.iterator in data)
      return Array.from(data)
   return Object.keys(data)
}


