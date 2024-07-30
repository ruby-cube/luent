import { ComponentSetup, HTMLTag, makeNode, NodeEntity } from "@rue/lumo";
import { normalizeToArray } from "@rue/utils";


export const jsxDEV = jsx;

export function jsx(nodeType: HTMLTag | ComponentSetup, config: { children: NodeEntity }) {
    if (nodeType instanceof Function && nodeType !== Fragment) {
        return makeNode(
            nodeType,
            config.children,
            config
        );
    }
    const children = normalizeToArray(config.children)
    if (nodeType === Fragment) {
        return children;
    }
    return makeNode(
        nodeType,
        children,
        config
    );

}

// export function jsxs(nodeType: HTMLTag | ComponentSetup, config: { children: NodeEntity[] }) {
//     console.log("JSXS")
//     console.trace()
//     if (nodeType === Fragment) return config.children;
//     //@ts-ignore
//     return makeNode(nodeType, config.children, config)
// }

export function Fragment() { }