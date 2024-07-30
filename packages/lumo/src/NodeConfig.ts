import { Component, ComponentSetup, InternalComponent } from "./component";
import { HTMLTag } from "./mE";
import { NodeRef } from "./NodeRef";
import { ListData } from "./forEachIn";
import { Signal } from "@rue/muonic/useSignalize";
import { DerivedSignal, ReactiveSignal } from "@rue/muonic/useDerivedSignal";
import { ComponentConfig, ElementConfig, RenderFunction } from "./makeNode";
import { ReactiveObject } from "@rue/muonic";


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
