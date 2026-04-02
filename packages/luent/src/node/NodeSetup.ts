import { ComponentForge } from "../component/Component";
import { TagName } from "../element/makeElement";
import { ListData } from "../iteratives/For";
import { ComponentConfig, ElementConfig } from "./makeJSXNode";
import {  Ion } from "@rue/quarky";


//NOTE: We use partial types so that we can split between spreading and directly passing values to template
export type NodeSetup<T extends TagName | ComponentForge> =
    T extends ComponentForge ? Partial<ComponentConfig<T>>
    : T extends TagName ? Partial<ElementConfig<T>>
    : never

// T extends TagName ? NodeSetupConfig : ComponentConfig<T extends ComponentForge ? T : never> & NodeSetupConfig
export type ItemNodeConfig<
    T extends TagName | ComponentForge,
    L extends ListData
> =
    L extends (infer I)[] ?
    ((item?: I, $index?: Ion<number>) => Partial<NodeSetup<T>>)
    : L extends Ion<(infer I)[]> ?
    (item?: I, $index?: Ion<number>) => Partial<NodeSetup<T>>
    : never

export function setUpNode<T extends TagName | ComponentForge>(node: TagName | ComponentForge, setup: NodeSetup<T>): NodeSetup<T> {
    return setup
}

export function setUpNodes<
    T extends TagName | ComponentForge,
    L extends ListData
>(listData: ListData, node: TagName | ComponentForge, setUpItem: ItemNodeConfig<T, L>): ItemNodeConfig<T, L> {
    return setUpItem;
}