import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { NodeEntity, normalizeToRenderFunction } from "../node/makeNode";
import { ListRenderKit } from "./ListRenderKit";
import { AtomicIon, ion, Ionized, MaybeIonized, ReactiveGet } from "@rue/quarky";


export type RenderItem<L = ListData> = L extends Ionized<Collection<infer I>> | ReactiveGet<Collection<infer I>> ? ((item: MaybeIonized<I>) => NodeEntity) | ((item: MaybeIonized<I>, $index: AtomicIon<number>) => NodeEntity) : L extends Collection<infer I> ? ((item: I) => NodeEntity) | ((item: I, index: number) => NodeEntity) : never
// type ListData = AnyObject | any[] | Set<any> | Map<any, any> | Ionized<AnyObject[] | Set<any> | Map<any, any> | AnyObject> //TODO: Implement for maps, sets, and objects. Not sure about updating behavior. What about strings and iterating over characters?
export type ListData<T = any> = Collection<T> | Ionized<Collection<T>> | ReactiveGet<Collection<T>>
export type UniqueItem = any;
export type Collection<T> = T[]  //TODO: add sets and maps



// | Set<T>

//TODO: Ionized item depending on if data is reactive
//TODO: $index: number | AtomicIon<number> based on whether list data is reactive
export function For<L extends ListData>(data: L, render: RenderItem<L> | NodeEntity): ListRenderKit
export function For<L extends ListData>(data: L, getUID: L extends Collection<infer T> ? (item: T) => unknown : (item: any)=>unknown, render: RenderItem<L>| NodeEntity): ListRenderKit
export function For<L extends ListData>(data: L, renderOrGetUID: RenderItem<L> | NodeEntity| (L extends Collection<infer T> ? (item: T) => unknown : never), render?: RenderItem<L>| NodeEntity): ListRenderKit {
   const uidProvided = arguments.length === 3
   const _render = normalizeToRenderFunction(uidProvided ? render! : renderOrGetUID ) as RenderItem<Ionized<any[]>>;
   const getUID = uidProvided ? <(item: unknown) => unknown>renderOrGetUID : undefined;
   return new ListRenderKit(_render, data, getUID)
}








