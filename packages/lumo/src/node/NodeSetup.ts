import { PublicComponent, ComponentSetup, InternalComponent } from "../component/InternalComponent";
import { HTMLTag } from "../element/makeElement";
import { ListData } from "../list/iterate_over";
import { DerivedSignal, ReactiveSignal } from "@rue/muonic/DerivedSignal";
import { ComponentConfig, ElementConfig, RenderFunction } from "./makeNode";
import { AtomicSignal } from "@rue/muonic";


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
    ((item?: I, $index?: AtomicSignal<number>) => NodeSetup<T>)
    : L extends ReactiveSignal<(infer I)[]> ?
    (item?: I, $index?: AtomicSignal<number>) => NodeSetup<T>
    : never
