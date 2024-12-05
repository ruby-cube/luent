import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { NodeEntity, normalizeToRenderFunction } from "../node/makeNode";
import { ListRenderKit } from "./ListRenderKit";
import { AtomicIon, ion, Ionized,  ReactiveGet } from "@rue/quarky";


export type RenderItem<T> = ((item: T) => NodeEntity) | ((item: T, $index: AtomicIon<number>) => NodeEntity)
// type ListData = AnyObject | any[] | Set<any> | Map<any, any> | Ionized<AnyObject[] | Set<any> | Map<any, any> | AnyObject> //TODO: Implement for maps, sets, and objects. Not sure about updating behavior. What about strings and iterating over characters?
export type ListData<T = any> = Collection<T> | Ionized<Collection<T>> | ReactiveGet<Collection<T>>
export type UniqueItem = any;
export type Collection<T> = T[]  //TODO: add sets and maps
// | Set<T>


//TODO: $index: number | AtomicIon<number> based on whether list data is reactive
export function For<T>(data: ListData<T>, render: RenderItem<T> | NodeEntity): ListRenderKit
export function For<T>(data: ListData<T>, getUID: (item: T) => unknown, render: RenderItem<T> | NodeEntity): ListRenderKit
export function For<T>(data: ListData<T>, renderOrGetUID: RenderItem<T> | NodeEntity | ((item: T) => unknown), render?: RenderItem<T> | NodeEntity): ListRenderKit {
   const uidProvided = arguments.length === 3
   const _render = normalizeToRenderFunction(uidProvided ? render! : renderOrGetUID as RenderItem<T>);
   const getUID = uidProvided ? <(item: unknown) => unknown>renderOrGetUID : undefined;
   return new ListRenderKit(_render, data, getUID)
}








