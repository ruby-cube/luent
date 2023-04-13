import { MiscObj } from '@rue/types';
import { ComponentPublicInstance, computed, ComputedRef, getCurrentInstance } from 'vue';


function genTreePathId() {
    const n = getCurrentInstance()?.proxy;
    if (n == null) throw new Error("genTreePathId must be called within component setup");
    const uid = genDevUID(n);
    let pathId = uid;
    let node = n;
    while (hasParent(node)) {
        const parent = node.$parent;
        pathId = genDevUID(parent) + "-" + pathId;
        node = node.$parent;
    }
    return pathId;
}

function hasParent(node: MiscObj): node is { $parent: ComponentPublicInstance } {
    return "$parent" in node && node.$parent;
}

function genDevUID(n: ComponentPublicInstance) {
    return n.$options.name + n.$.uid.toString();
}

export function getComponentUID() {
    if (__DEV__) return genTreePathId();
    return getCurrentInstance()?.uid.toString();
}



