
// Vine: The entire tree structure
// Path: [node, node, node]
// Pod: A property that contains pea nodes
// Pea: A child
// Parent: the parent node 

import { AnyObject } from "@rue/types";
import { isIterable } from "../utils/array";
import { getKeyPathValue } from "@rue/utils";

export const DONE = Symbol("exit tree")

// Singleton, maps childNode to parentNode
type ChildNode = VineNode;
type ParentNode = VineNode;
type PodKeypath = string[];
const vineConnections: WeakMap<ChildNode, [ParentNode, PodKeypath]> = new WeakMap();

function connectPeaToParent(pea: VineNode, parent: VineNode, podKeypath: string[]) {
    vineConnections.set(pea, [parent, podKeypath]);
}

function disconnectPeaFromParent(pea: VineNode) {
    vineConnections.delete(pea);
}

export class VineNode {

    get parent(): VineNode | null {
        const parentEntry = vineConnections.get(this);
        return parentEntry ? parentEntry[0] : null;
    }

}

// OPTIONAL METHODS (TREESHAKEABLE)

export function climbUp(this: VineNode, op: (node: VineNode) => typeof DONE | void) {
    if (this.parent === null) return;
    const parent = this.parent;
    const done = op(parent);
    if (done === DONE) return;
    if (!("climbUp" in parent)) throw "climbUp method does not exist in parent node";

    (<typeof climbUp>parent.climbUp)(op);
}

export function climbDown(this: VineNode, pods: string[], ops: { enter: (node: VineNode, parent: VineNode, key: string, index: number) => typeof DONE, leave: () => typeof DONE }) {
    for (const pod in pods) {
        if (pod in this) {

        }
    }
}

export function traverse() {

}

export function append(this: VineNode & AnyObject, podKeypath: string[], ...peas: VineNode[]) {
    _insertIntoPod((peapod: unknown, pea: VineNode) => {
        if (!(peapod instanceof Array)) throw "Peapod must be an array";
        peapod.push(pea)
    }, this, podKeypath, ...peas)
}

export function prepend(this: VineNode, podKeypath: string[], ...peas: VineNode[]) {
    _insertIntoPod((peapod: unknown, pea: VineNode) => {
        if (!(peapod instanceof Array)) throw "Peapod must be an array";
        peapod.unshift(pea)
    }, this, podKeypath, ...peas)
}

export function insert(this: VineNode, podKeypath: string[], ...peas: VineNode[]) {

}

function _insertIntoPod(ops: (peapod: VineNode[], pea: VineNode) => void, node: VineNode, podKeypath: string[], ...peas: VineNode[]) {
    const _peas = getKeyPathValue(node, podKeypath);
    if (!isIterable(_peas)) throw `Keypath ${podKeypath} must access an iterable`
    for (const pea of peas) {
        ops(_peas, pea)
        connectPeaToParent(pea, node, podKeypath)
    }
}

export function removePea(this: VineNode, podKeypath: string[], pea: VineNode) {
    const pod = getKeyPathValue(this, podKeypath);
    if (pod instanceof Array) {
        pod.splice(pod.indexOf(pea), 1);
    }
    else if (pod instanceof Set) {
        pod.delete(pea)
    }
    else {
        throw "Pod must be an instance of Array or Set"
    }
    disconnectPeaFromParent(pea)
}


export function detach(this: VineNode) {
    const [parent, podKeypath] = vineConnections.get(this) ?? [];
    if (parent) {
        removePea.apply(parent, [podKeypath!, this])
    }
}





class TagTree {
    roots: Tag[]

    constructor() {

    }
}


class PinnedTags {
    roots: Tag[]

    constructor() {

    }
}

class Tag extends VineNode {
    constructor() {
        super()
    }
}