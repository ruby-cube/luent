import { getCommons } from "../commons/commons-stack";
import { MaybeIon } from "../component/Input";
import { JSXNode, normalizeToRenderFunction } from "../node/makeNode";
import { ListRenderKit } from "./ListRenderKit";
import { Ion, IonizeBy, Ionized, isIon, IsIonized, isIonizedModel, MaybeIonized } from "@rue/quarky";


export type RenderItem<L> =
L extends Ion<infer D> ? D extends Collection<infer I> ? (item: IonizeBy<D, I>, $i: Ion<number>) => JSXNode : 'frog'
   :IsIonized<L> extends true  ? L extends {[key: number]: infer I} ?(item: I, $i: Ion<number>) => JSXNode : 'frog' //TODO: Sets and maps?
   : L extends Collection<infer I> ? (item: IonizeBy<L, I>, $i: Ion<number>) => JSXNode
   : (item: any, $i: Ion<number>) => JSXNode
// L extends Collection<infer I> | Ion<Collection<infer I>> ? ((item: I) => JSXNode) | ((item: I, $index: AtomicIon<number>) => JSXNode)
// : L extends Collection<infer I> ? ((item: I) => JSXNode) | ((item: I, index: number) => JSXNode)
// : never
// type ListData = AnyObject | any[] | Set<any> | Map<any, any> | Ionized<AnyObject[] | Set<any> | Map<any, any> | AnyObject> //TODO: Implement for maps, sets, and objects. Not sure about updating behavior. What about strings and iterating over characters?
export type ListData<T = any> = MaybeIon<Collection<T>>
export type UniqueItem = any;
export type Collection<T> = MaybeIon<T[]>  | MaybeIon<Set<T>>|  MaybeIon<Map<T>> //TODO: add maps


//TODO: account for list ion having undefined state
//TODO: Ionized item depending on if data is reactive
//TODO: $index: number | AtomicIon<number> based on whether list data is reactive
// export function For<L extends any[]>(data: L, render: ((item: L extends (infer I)[]? I : never, $index: Ion<number>)=>JSXNode) | JSXNode): ListRenderKit {
   export function For<L extends ListData>(data: L, render: RenderItem<L>): ListRenderKit
export function For<L extends ListData>(data: L, getUID: L extends Collection<infer T> ? (item: T) => unknown : (item: any) => unknown, render: RenderItem<L>): ListRenderKit|undefined | JSXNode[][]
export function For<L extends ListData>(data: L, renderOrGetUID: RenderItem<L> | (L extends Collection<infer T> ? (item: T) => unknown : never), render?: RenderItem<L>): ListRenderKit|undefined |JSXNode[][]{
   const uidProvided = arguments.length === 3
   const _render = normalizeToRenderFunction(uidProvided ? render! : renderOrGetUID) as RenderItem<any[]>;
   const getUID = uidProvided ? <(item: unknown) => unknown>renderOrGetUID : undefined;
   if (!isIon(data) && !isIonizedModel(data)) return renderStaticList(data, _render)
   return new ListRenderKit(_render, data, getUID, getCommons())
}



function renderStaticList(data: undefined | unknown[] | Set<unknown> | Map<unknown, unknown>, render: (item: unknown, index: number)=>JSXNode[]){
   if (!data) return;
   const array = normalizeToArray(data)
   const renderedList: JSXNode[][] = []
   for (let i = 0; i < array.length; i++){
      renderedList.push(render(array[i], i))
   }
   return renderedList
}

function normalizeToArray(data: unknown[] | Set<unknown> | Map<unknown, unknown>){
   if (Array.isArray(data)) return data;
   return Array.from(data)
}


