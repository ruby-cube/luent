import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { NodeEntity } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { $listen, Callback, collectEffects, EffectFlask, ListenerOptions } from "@rue/flask";
import {  makeDynamicNode } from "../dynamic/makeDynamicNode";
import { DynamicNode } from "../dynamic/DynamicNode";
import { getComponent, InternalComponent } from "../component/InternalComponent";
import { ListRenderKit } from "./ListRenderKit";
import { AtomicSignal, ReactiveSignal } from "@rue/muonic";
import { ReactiveModel } from "../../../muonic/src/reactivemodel/ReactiveModel";


export type RenderItem<T = any> = (item: T, $index: AtomicSignal<number>) => NodeEntity[] | NodeEntity
// type ListData = AnyObject | any[] | Set<any> | Map<any, any> | ReactiveModel<AnyObject[] | Set<any> | Map<any, any> | AnyObject> //TODO: Implement for maps, sets, and objects. Not sure about updating behavior. What about strings and iterating over characters?
export type ListData<T = any> = Collection<T> | ReactiveModel<Collection<T>> | ReactiveSignal<Collection<T>>
export type UniqueItem = any;
export type Collection<T> = T[]  //TODO: add sets and maps
// | Set<T>



export function iterate_over<T>(data: Collection<T>, render: RenderItem<T>, idKey?: string): ListRenderKit // static list
export function iterate_over<T>(data: ReactiveModel<Collection<T>> | ReactiveSignal<Collection<T>>, render: RenderItem<T>, idKey?: string): ListRenderKit // dynamic list
export function iterate_over<T>(data: ReactiveModel<Collection<T>> | ReactiveSignal<Collection<T>>, render: RenderItem<T>, idKey?: string): ListRenderKit // dynamic list
export function iterate_over<T>(data: ListData<T>, render: RenderItem<T>, idKey?: string): ListRenderKit {
    return new ListRenderKit(render, data, getComponent(iterate_over.name), idKey)
}








