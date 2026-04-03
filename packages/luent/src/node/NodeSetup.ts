import { ComponentTag } from "../component/Component";
import { TagName } from "../element/makeElement";
import { ListData } from "../iteratives/For";
import { ComponentConfig, ElementConfig } from "./makeJSXNode";
import {  Ion } from "@rue/quarky";


//NOTE: We use partial types so that we can split between spreading and directly passing values to template
export type NodeSetup<T extends TagName | ComponentTag> =
    T extends ComponentTag ? Partial<ComponentConfig<T>>
    : T extends TagName ? Partial<ElementConfig<T>>
    : never

// T extends TagName ? NodeSetupConfig : ComponentConfig<T extends ComponentTag ? T : never> & NodeSetupConfig
export type ItemNodeConfig<
    T extends TagName | ComponentTag,
    L extends ListData
> =
    L extends (infer I)[] ?
    ((item?: I, $index?: Ion<number>) => Partial<NodeSetup<T>>)
    : L extends Ion<(infer I)[]> ?
    (item?: I, $index?: Ion<number>) => Partial<NodeSetup<T>>
    : never

export function setUpNode<T extends TagName | ComponentTag>(node: TagName | ComponentTag, setup: NodeSetup<T>): NodeSetup<T> {
    return setup
}

export function setUpNodes<
    T extends TagName | ComponentTag,
    L extends ListData
>(listData: ListData, node: TagName | ComponentTag, setUpItem: ItemNodeConfig<T, L>): ItemNodeConfig<T, L> {
    return setUpItem;
}