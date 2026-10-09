import { getFlask } from "@luently/flask";
import { IonOr } from "../component/bindings-types";
import { normalizeToRenderFunction, RawJSXNode } from "../node/makeJSXNode";
import { ListKit, toAsyncRenderItem } from "./ItemList";
import { queueInternalRender, awaitPrelude, awaitRender, Ion, Ionic, isGetter, PRELUDE, queueTask, toIon, toValue, observe } from "@luently/quarky";
import { isIonicProxy } from "@luently/quarky/core";
import { __DEV__buildAsyncPath, TRACE } from "@luently/flask";
import { ForIndex, Nullish } from "./IndexedList";
import { createStack } from "@luently/utils";
import { AnyObject } from "@luently/types";


// export type RenderItem<L> =
//    L extends Ion<infer D> ? D extends Collection<infer I> ? (item: IonizeBy<D, I>, $i: Ion<number>) => RawJSXNode : 'frog'
//    : IsIonic<L> extends true ? L extends { [key: number]: infer I } ? (item: MaybeIonize<I>, $i: Ion<number>) => RawJSXNode : 'frog' // TODO: Sets and maps?
//    : L extends Collection<infer I> ? (item: IonizeBy<L, I>, $i: Ion<number>) => RawJSXNode
//    : (item: any, $i: Ion<number>) => RawJSXNode


export type ListData = IonOr<AnyObject | Nullish>
export type UniqueItem = any;
export type Collection<T> = IonOr<T[]>

type GetKey<L> = L extends (infer I)[] ? (item: I) => unknown : never

type RenderDynamicIndex<L> = L extends (infer I)[] ? ($item: Ion<I>, index: number) => RawJSXNode
  : L extends Set<infer I> ? ($item: Ion<I>, index: number) => RawJSXNode
  : L extends Map<infer K, infer V> ? (entry: [Ion<K>, Ion<V>], index: number) => RawJSXNode
  : L extends object ? (key: keyof L, index: number) => RawJSXNode
  : never

export type RenderItem<L> = L extends (infer I)[] ? (item: I, $index: Ion<number>) => RawJSXNode
  : never

type RenderStatic<L> = L extends (infer I)[] ? (item: I, index: number) => RawJSXNode
  : L extends Set<infer I> ? (item: I, index: number) => RawJSXNode
  : L extends Map<infer K, infer V> ? (entry: [K, V], index: number) => RawJSXNode
  : L extends object ? (key: keyof L, index: number) => RawJSXNode
  : (item: unknown, index: unknown) => RawJSXNode

type IsReactive<L> = L extends Ion<any> ? true : L extends { '~ionic': true } ? true : false

type RenderIndex<L> = IsReactive<L> extends false ? RenderStatic<L> : RenderDynamicIndex<ToValue<L>>

type ToValue<T> = T extends Ion<infer V> ? V : T




// for List transitions:
const [pushList, popList, getList] = createStack<any>()

export function atListChanged(task: () => void) {
  const list = getList()
  queueInternalRender(() => { // QUESTION: Why is this important? When observe was being set up synchronously, any items that were initially loaded would not transition properly and inserted items would get unnecessarily transitioned in. awaitPrelude is too early and messes up consecutively inserted items
    observe(list, task, { phase: PRELUDE })
  })
}

function wrapWithList(renderItem: RenderItem<any>, list: any) {
  return (item: any, index: any) => {
    try {
      pushList(list)
      return renderItem(item, index)
    }
    finally {
      popList()
    }
  }
}




export function For<L, U>(data: L & IonOr<Ionic<any[]> | any[] | Nullish>, getKey: GetKey<ToValue<L>>, render: RenderItem<ToValue<L>>): ListKit | undefined | RawJSXNode
export function For<L, U>(data: L & ListData, render: RenderIndex<L>): ListKit | undefined | RawJSXNode
export function For<L, U>(data: L & ListData, renderOrGetUID: GetKey<ToValue<L>> | RenderIndex<L>, render?: RenderItem<ToValue<L>>): ListKit | undefined | RawJSXNode {
  if (!data) return;
  const uidProvided = arguments.length === 3
  const _render = normalizeToRenderFunction(uidProvided ? render! : renderOrGetUID);
  if ( isGetter(data) || isIonicProxy(data) && isIterable(data)) {
    if (import.meta.env.SSR) {
      if (uidProvided) {
        return renderStaticList(toValue(data), _render, 'index')
      }
      return renderStaticList(toValue(data), _render, 'item')
    }
    if (uidProvided) {
      return new ListKit(toIon(data), toAsyncRenderItem(wrapWithList(_render, data)), renderOrGetUID as (item: unknown) => unknown, getFlask())
    }
    return ForIndex(data, toAsyncRenderItem(_render))
  }
  else {
    return renderStaticList(toValue(data), _render)
  }
}

function isIterable(data: any) {
  return Symbol.iterator in data
}



function renderStaticList(data: undefined | unknown[] | Set<unknown> | Map<unknown, unknown> | AnyObject, render: (item: unknown, index: number) => RawJSXNode, reactive?: 'item' | 'index') {
  if (!data) return;
  const array = normalizeToArray(data)
  const renderedList = []
  for (let i = 0; i < array.length; i++) {
    renderedList.push(render(reactive === 'item' ? () => array[i] : array[i], reactive === 'index' ? () => i : i))
  }
  return renderedList
}

function normalizeToArray(data: unknown[] | { [Symbol.iterator]: any } | ArrayLike<any> | object) {
  if (Array.isArray(data)) return data;
  if (Symbol.iterator in data)
    return Array.from(data)
  return Object.keys(data)
}


