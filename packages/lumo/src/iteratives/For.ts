import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { NodeEntity, normalizeToRenderFunction } from "../node/makeNode";
import { ListRenderKit } from "./ListRenderKit";
import { AtomicIon, ion, IonicModel, ReactiveGet } from "@rue/quarky";
import { getContext } from "../context/context-stack";
import { getPhasicNode } from "../transition/PhasicNode";


export type RenderItem<T = any> = (item: T, $index: AtomicIon<number>) => NodeEntity[] | NodeEntity
// type ListData = AnyObject | any[] | Set<any> | Map<any, any> | IonicModel<AnyObject[] | Set<any> | Map<any, any> | AnyObject> //TODO: Implement for maps, sets, and objects. Not sure about updating behavior. What about strings and iterating over characters?
export type ListData<T = any> = Collection<T> | IonicModel<Collection<T>> | ReactiveGet<Collection<T>>
export type UniqueItem = any;
export type Collection<T> = T[]  //TODO: add sets and maps
// | Set<T>



export function For<T>(data: ListData<T>, render: RenderItem<T> | NodeEntity | NodeEntity[]): ListRenderKit
export function For<T>(data: ListData<T>, getUID: (item: T) => unknown, render: RenderItem<T> | NodeEntity | NodeEntity[]): ListRenderKit
export function For<T>(data: ListData<T>, renderOrGetUID: RenderItem<T> | NodeEntity | NodeEntity[] | ((item: T) => unknown), render?: RenderItem<T> | NodeEntity | NodeEntity[]): ListRenderKit {
   const uidProvided = arguments.length === 2
   const _render = normalizeToRenderFunction(uidProvided ? render! : renderOrGetUID as RenderItem<T>);
   const getUID = uidProvided ? <(item: unknown) => unknown>renderOrGetUID : undefined;
   return new ListRenderKit(_render, data, getContext(), getUID, getPhasicNode())
}








