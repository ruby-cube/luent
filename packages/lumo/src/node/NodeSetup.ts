import {  ComponentSetup, InternalComponent } from "../component/InternalComponent";
import { HTMLTag } from "../element/makeElement";
import { ListData } from "../list/For";
import { ComponentConfig, ElementConfig, RenderFunction } from "./makeNode";
import { ReactiveGet, AtomicIon } from "../../../quarky/src";


export type NodeSetup<T extends HTMLTag | ComponentSetup> =
    T extends ComponentSetup ? ComponentConfig<T>
    : T extends HTMLTag ? ElementConfig<T> 
    : never

// T extends HTMLTag ? NodeSetupConfig : ComponentConfig<T extends ComponentSetup ? T : never> & NodeSetupConfig
export type ItemNodeConfig<
    T extends HTMLTag | ComponentSetup,
    L extends ListData
> =
    L extends (infer I)[] ?
    ((item?: I, $index?: AtomicIon<number>) => NodeSetup<T>)
    : L extends ReactiveGet<(infer I)[]> ?
    (item?: I, $index?: AtomicIon<number>) => NodeSetup<T>
    : never
