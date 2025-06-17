import { getCommons } from "../commons/commons-stack";
import { MaybeIon } from "../component/Input";
import { NodeEntity, normalizeToRenderFunction } from "../node/makeNode";
import { ListRenderKit } from "./ListRenderKit";
import { Ion, IonizeBy, Ionized, IsIonized, MaybeIonized } from "@rue/quarky";


export type RenderItem<L> =
L extends Ion<infer D> ? D extends Collection<infer I> ? (item: IonizeBy<D, I>, $i: Ion<number>) => NodeEntity : 'frog'
   :IsIonized<L> extends true  ? L extends {[key: number]: infer I} ?(item: I, $i: Ion<number>) => NodeEntity : 'frog' //TODO: Sets and maps?
   : L extends Collection<infer I> ? (item: IonizeBy<L, I>, $i: Ion<number>) => NodeEntity
   : (item: any, $i: Ion<number>) => NodeEntity
// L extends Collection<infer I> | Ion<Collection<infer I>> ? ((item: I) => NodeEntity) | ((item: I, $index: AtomicIon<number>) => NodeEntity)
// : L extends Collection<infer I> ? ((item: I) => NodeEntity) | ((item: I, index: number) => NodeEntity)
// : never
// type ListData = AnyObject | any[] | Set<any> | Map<any, any> | Ionized<AnyObject[] | Set<any> | Map<any, any> | AnyObject> //TODO: Implement for maps, sets, and objects. Not sure about updating behavior. What about strings and iterating over characters?
export type ListData<T = any> = MaybeIon<Collection<T>>
export type UniqueItem = any;
export type Collection<T> = MaybeIon<T[]> | MaybeIon<readonly T[]> | MaybeIon<Set<T>> //TODO: add maps


//TODO: account for list ion having undefined state
//TODO: Ionized item depending on if data is reactive
//TODO: $index: number | AtomicIon<number> based on whether list data is reactive
// export function For<L extends any[]>(data: L, render: ((item: L extends (infer I)[]? I : never, $index: Ion<number>)=>NodeEntity) | NodeEntity): ListRenderKit {
   export function For<L extends ListData>(data: L, render: RenderItem<L>): ListRenderKit
export function For<L extends ListData>(data: L, getUID: L extends Collection<infer T> ? (item: T) => unknown : (item: any) => unknown, render: RenderItem<L>): ListRenderKit
export function For<L extends ListData>(data: L, renderOrGetUID: RenderItem<L> | (L extends Collection<infer T> ? (item: T) => unknown : never), render?: RenderItem<L>): ListRenderKit {
   const uidProvided = arguments.length === 3
   const _render = normalizeToRenderFunction(uidProvided ? render! : renderOrGetUID) as RenderItem<any[]>;
   const getUID = uidProvided ? <(item: unknown) => unknown>renderOrGetUID : undefined;
   return new ListRenderKit(_render, data, getUID, getCommons())
}







