import { ComponentConfig, ComponentSetup, ElementConfig, HTMLTag } from "@rue/lumo";

export type HTMLString = string;

export type InferSlotted<T extends ComponentSetupWithSlot = ComponentSetupWithSlot> =
    T extends (props: infer P) => any ?
    P extends { Slotted: infer S } ?
    S
    : undefined
    : undefined

export type PropsWithSlot = {
    slot: ((...args: any[]) => HTMLString) | { [key: string]: (...args: any[]) => HTMLString }
}

type ComponentSetupWithSlot<P extends PropsWithSlot = PropsWithSlot> =
    (props: P) => HTMLString[] | HTMLString

export function jsx(tag: any, config: any, ...children: any[]) {
    return makeNode(tag, children, config || {})
}

export function makeNode(
    nodeType: HTMLTag | ComponentSetup,
    childNodes: HTMLString[] | InferSlotted,
    config: ElementConfig | ComponentConfig,
): HTMLString | InternalComponent {
    const [_, $index] = getCurrentItemAndIndex();
    if (typeof nodeType === "string")
        return makeElement(
            nodeType,
            <NodeEntity[]>childNodes,
            <ElementConfig>config,
            $index
        )
    return makeComponent(
        nodeType,
        <InferSlotted>childNodes,
        <ComponentConfig>config,
        $index
    )
}