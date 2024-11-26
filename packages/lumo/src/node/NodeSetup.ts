import { ComponentSetup, InternalComponent } from "../component/InternalComponent";
import { HTMLTag } from "../element/makeElement";
import { ListData } from "../iteratives/For";
import { ComponentConfig, ElementConfig } from "./makeNode";
import { AtomicIon, ReactiveGet, ion } from "@rue/quarky";


//NOTE: We use partial types so that we can split between spreading and directly passing values to template
export type NodeSetup<T extends HTMLTag | ComponentSetup> =
    T extends ComponentSetup ? Partial<ComponentConfig<T>>
    : T extends HTMLTag ? Partial<ElementConfig<T>>
    : never

// T extends HTMLTag ? NodeSetupConfig : ComponentConfig<T extends ComponentSetup ? T : never> & NodeSetupConfig
export type ItemNodeConfig<
    T extends HTMLTag | ComponentSetup,
    L extends ListData
> =
    L extends (infer I)[] ?
    ((item?: I, $index?: AtomicIon<number>) => Partial<NodeSetup<T>>)
    : L extends ReactiveGet<(infer I)[]> ?
    (item?: I, $index?: AtomicIon<number>) => Partial<NodeSetup<T>>
    : never

export function setUpNode<T extends HTMLTag | ComponentSetup>(node: HTMLTag | ComponentSetup, setup: NodeSetup<T>): NodeSetup<T> {
    return setup
}

export function setUpNodes<
    T extends HTMLTag | ComponentSetup,
    L extends ListData
>(listData: ListData, node: HTMLTag | ComponentSetup, setUpItem: ItemNodeConfig<T, L>): ItemNodeConfig<T, L> {
    return setUpItem;
}