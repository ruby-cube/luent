import { Component, ComponentSetup, InternalComponent } from "./component";
import { HTMLTag } from "./mE";
import { ComponentConfig } from "./mO";
import { NodeRef } from "./NodeRef";
import { ListData } from "./forEachIn";
import { Signal } from "@rue/muonic/useSignalize";
import { DerivedSignal, ReactiveSignal } from "@rue/muonic/useDerivedSignal";
import { NodeSetupConfig, RenderFunction } from "./makeNode";
import { ReactiveObject } from "@rue/muonic";


export type NodeConfig<T extends HTMLTag | ComponentSetup = HTMLTag | ComponentSetup> =
    T extends (props: infer P) => any ? P
    : T extends HTMLTag ? NodeSetupConfig<T> 
    : never

// T extends HTMLTag ? NodeSetupConfig : ComponentConfig<T extends ComponentSetup ? T : never> & NodeSetupConfig
export type ListConfig<
    T extends HTMLTag | ComponentSetup = HTMLTag | ComponentSetup,
    L extends ListData = ListData
> =
    L extends (infer I)[] ?
    ((item: I, $index: Signal<number>) => NodeConfig<T>)
    : L extends ReactiveSignal<(infer I)[]> ?
    (item: I, $index: Signal<number>) => NodeConfig<T>
    : never


export function setUpNode<T extends HTMLTag | ComponentSetup>(
    nodeType: T,
    config: NodeConfig<T>
) {
    return config;
}


export function setUpNodesFor<T extends HTMLTag | ComponentSetup, L extends ListData>(
    list: L, // This is here for typing purposes only //TODO: should I use this to validate?
    nodeType: T,
    config: ListConfig<T, L>
) {
    return config;
}
