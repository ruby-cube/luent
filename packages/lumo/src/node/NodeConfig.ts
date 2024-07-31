import { PublicComponent, ComponentSetup, InternalComponent } from "../component/component";
import { HTMLTag } from "../element/mE";
import { ListData } from "../list/forEachIn";
import { Signal } from "@rue/muonic/useSignals";
import { DerivedSignal, ReactiveSignal } from "@rue/muonic/DerivedSignal";
import { ComponentConfig, ElementConfig, RenderFunction } from "./makeNode";


export type NodeConfig<T extends HTMLTag | ComponentSetup> =
    T extends ComponentSetup ? ComponentConfig<T>
    : T extends HTMLTag ? ElementConfig<T> 
    : never

// T extends HTMLTag ? NodeSetupConfig : ComponentConfig<T extends ComponentSetup ? T : never> & NodeSetupConfig
export type ItemNodeConfig<
    T extends HTMLTag | ComponentSetup,
    L extends ListData
> =
    L extends (infer I)[] ?
    ((item?: I, $index?: Signal<number>) => NodeConfig<T>)
    : L extends ReactiveSignal<(infer I)[]> ?
    (item?: I, $index?: Signal<number>) => NodeConfig<T>
    : never
