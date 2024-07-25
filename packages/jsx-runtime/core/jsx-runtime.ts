import { ComponentSetup, HTMLTag, mE, NodeEntity } from "@rue/lumo";


export const jsxDEV = jsx;

export function jsx(nodeType: HTMLTag | ComponentSetup, config: { children: NodeEntity }) {
    console.log("it works!!!!!!!!!! :D")
    return mE(nodeType, [config.children], config);
}

export function jsxs(nodeType: HTMLTag | ComponentSetup, config: { children: NodeEntity }) {
    console.log("it works!!!!!!! :D")
    if (nodeType === Fragment) return config.children;
    return mE(nodeType, config.children, config)
}

export function Fragment() {

}