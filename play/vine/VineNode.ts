
// Vine: The entire tree structure
// Path: [node, node, node]
// Pod: A property that contains pea nodes
// Pea: A child
// Parent: the parent node 

import { AnyObject, Observable, makeObservable } from "../muonic/ObservableCapsule";
import { getDepot } from "./DepotMap";
import { NodeID, VineNodeDepot } from "./NodeDepot";


export const DONE = Symbol("exit tree")


class VineNode {
    id: NodeID;

    private depot: VineNodeDepot<VineNode>;

    private parentID: NodeID | null

    get parent(): VineNode | null {
        if (this.parentID) return this.depot.get(this.parentID) || null;
        return null;
    }

    private setParentID(id: NodeID) {
        this.parentID = id;
    }

    constructor(type: string) {
        const depot = getDepot(type);

        this.depot = depot;
        this.id = depot.genID();
        this.parentID = null
    }

    climbUp(ops: (node: VineNode) => typeof DONE | void) {
        if (this.parent === null) return;
        const parent = this.parent;
        const done = ops(parent)
        if (done === DONE) return;
        this.parent.climbUp(ops);
    }

    climbDown(pods: string[], ops: { enter: (node: VineNode, parent: VineNode, key: string, index: number) => typeof DONE, leave: () => typeof DONE }) {
        for (const pod in pods) {
            if (pod in this) {

            }
        }
    }

    traverse() {

    }
}

function append(this: VineNode & AnyObject, keypath: string[], ...peas: VineNode[]) {
    for (const key of keypath) {
        if (!(key in this)) throw `${key} property does not exist in node`;
        const obj = 
    }
    const _peas = this[pod];
    for (const pea of peas) {
        _peas.push(pea);
        this.parentID = this.id;
    }
}




function prepend(this: VineNode, ...peas: VineNode[]) {
    for (const pea of peas) {
        this.peas.unshift(pea);
        this.connectParentToPea(pea);
    }
}

function insert(this: VineNode, ...peas: VineNode[]) {

}



class TagPod extends Peapod implements Observable {
    $: VineNode[]

    constructor(node: VineNode) {
        super(node);

    }

    makeObservable = makeObservable
}


class Doc extends VineNode {

    $: {
        tags: Peapod<Tag>
    }

    tags: TagPod;

    constructor() {
        super("Doc");
        this.tags = new TagPod(this)
    }
}


watch(doc.tags.$)


class Tag {

}