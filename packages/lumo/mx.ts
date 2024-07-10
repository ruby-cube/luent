import { AnyObject } from "@rue/types";
import { SetKey, Signal } from "../muonic/useSignalize";
import { DOMNode, getCurrentComponent, InternalComponent } from "./component";
import { watchForUpdate } from "./watchForUpdate";
import { $, hasSignal, ReactiveSignal } from "../muonic/useDerivedSignal";
import { getWithoutTracking } from "../muonic/DependencyTracker";
import { ListRenderKit } from "./mxsFor";
import { LifecycleHooks } from "./lifecycle";
import { InitialConditionalRenderKit } from "./mxIf";
import { isEqual } from "@rue/utils";


type NodeCluster = (DOMNode | DynamicNodeCluster)[]
// type DynamicNodeCluster = NodeCluster[]

export type NodeEntity = DOMNode | InternalComponent | ListRenderKit | InitialConditionalRenderKit | string | ReactiveSignal<string> // TODO: Attach context to DOMNode, InternalComponent, ListRenderKit, and InitialConditionalRenderKit




type DOMNodeConfig<T extends keyof HTMLElementTagNameMap> = {
    attrs?: AnyObject;
    on?: { [key: string]: () => void } //TODO: how to distinguish handler from reactive getter??
    class?: string | { [key: string]: () => boolean };
    style?: any;
    text?: string | ReactiveSignal<string>;
    nodes?: NodeEntity[];
    key?: string | number
    ref?: Signal
}








export function mx<T extends keyof HTMLElementTagNameMap>(tagName: T, config: DOMNodeConfig<T> = {}): DOMNode {
    const { nodes, text, attrs, class: _class, style, on, ref, key } = config;
    const domNode = document.createElement(tagName);
    const component = getCurrentComponent();
    if (!component || component === "root") throw new Error("No component :(")
    if (text != null && nodes) throw new Error(`Element ${tagName} cannot contain both text and nodes`)
    if (text) setUpTextNode(domNode, text)
    else if (nodes) {
        const clusterBuilder = new NodeClusterBuilder();
        for (const nodeEntity of nodes) {
            setUpNodeEntity(domNode, nodeEntity, clusterBuilder)
        }
    }

    if (on) {
        for (const event in on) {

        }
    }


    if (ref) {
        //@ts-expect-error
        ref[SetKey](() => domNode) //NOTE: DomNode will never change for static entities
    }

    return domNode;
}

function setUpTextNode(parent: DOMNode, text: ReactiveSignal | string, nodeClusterBuilder?: NodeClusterBuilder) {
    const textNode = createTextNode(text); //QUESTION: In cases of empty string, should textNode be created? What is more important... clean HTML or less DOM manipulations?
    if (nodeClusterBuilder) {
        nodeClusterBuilder.appendStaticNode(textNode)
    }
    parent.appendChild(textNode);
    if (hasSignal(text)) {
        keepTextNodeUpdated(text, textNode)
    }
}

function keepTextNodeUpdated($text: () => string, textNode: CharacterData) {
    watchForUpdate($text, (newValue) => {
        textNode.data = newValue;
    });
}

function createTextNode(value: ReactiveSignal | string) {
    const text = typeof value === "string" ? value : getWithoutTracking(value);
    const textNode = document.createTextNode(text);
    return textNode;
}

function mountNode(parent: DOMNode, node: DOMNode) {
    parent.appendChild(node);
}

function mountNodes(parent: DOMNode, nodes: (DOMNode | DOMNode[])[]) {
    for (const nodeOrGroup of nodes) {
        if (nodeOrGroup instanceof Array) {
            mountNodes(parent, nodeOrGroup);
        }
        else {
            parent.appendChild(nodeOrGroup);
        }
    }
}

class NodeClusterBuilder {
    cluster: NodeCluster = [];
    private currentIndex: number = 0


    appendStaticNode(node: DOMNode) {
        this.cluster.push(node);
        this.currentIndex++;
    }

    appendDynamicCluster() {
        const dynamicCluster = new DynamicNodeCluster(this.cluster, this.currentIndex)
        this.cluster.push(dynamicCluster);
        this.currentIndex++;
        return dynamicCluster;
    }

    // private createSegment(type: 'static' | 'dynamic') {
    //     const segment: DOMNode[] = []
    //     this.cluster.push(segment);
    //     this.prevIndex++;
    //     this.prevType = type;
    //     return segment;
    // }
}

class DynamicNodeCluster {
    private cluster: NodeCluster[] = []
    index: number;
    pod: NodeCluster;

    constructor(pod: NodeCluster, index: number) {
        this.index = index;
        this.pod = pod;
    }

    appendNodeCluster() {
        const nodeClusterBuilder = new NodeClusterBuilder();
        this.cluster.push(nodeClusterBuilder.cluster)
        return nodeClusterBuilder;
    }

    get() {
        return this.cluster
    }

    get prevNode() {
        const item = this.pod.at(this.index - 1);
        if (!item) return null;
        if (item instanceof DynamicNodeCluster) {
            return item.lastNode;
        }
        return item;
    }

    get lastNode(): DOMNode | null {
        const nodeCluster = this.cluster.at(this.index - 1);
        if (!nodeCluster) return null;
        const item = nodeCluster?.at(-1);
        if (!item) return null;
        if (item instanceof DynamicNodeCluster) {
            return item.lastNode;
        }
        return item;
    }
}

function setUpNodeEntity(parent: DOMNode, nodeEntity: NodeEntity, clusterBuilder: NodeClusterBuilder) {
    if (typeof nodeEntity === "string" || hasSignal(nodeEntity)) {
        setUpTextNode(parent, nodeEntity, clusterBuilder)
    }
    else if (nodeEntity instanceof Node) { // from Web API
        setUpNode(parent, nodeEntity, clusterBuilder)
    }
    else if (nodeEntity instanceof InternalComponent) {
        setUpComponent(parent, nodeEntity, clusterBuilder)
    }
    else if (nodeEntity instanceof ListRenderKit) { // this may or may not be dynamic, depending on data
        setUpNodeList(parent, nodeEntity, clusterBuilder);
    }
    else if (nodeEntity instanceof InitialConditionalRenderKit) {
        setUpConditionalEntity(parent, nodeEntity, clusterBuilder)
    }
    else {
        throw new Error("Invalid input")
    }
}



function setUpNode(parent: DOMNode, node: DOMNode, nodeClusterBuilder: NodeClusterBuilder) {
    nodeClusterBuilder.appendStaticNode(node)
    parent.appendChild(node);
}



function setUpComponent(parent: DOMNode, component: InternalComponent, nodeClusterBuilder: NodeClusterBuilder) { //TODO: what if a component's root elements is conditional or a dynamic list??
    const nodeEntities = component.initialNodeEntities;
    if (!(parent instanceof HTMLElement)) throw new Error("Parent cannot be a text node")
    component.runTasks(LifecycleHooks.BEFORE_MOUNT);
    for (const nodeEntity of nodeEntities) {
        if (nodeEntity instanceof Node) {
            parent.appendChild(nodeEntity);
            nodeClusterBuilder.appendStaticNode(nodeEntity)
        }
        else if (nodeEntity instanceof ListRenderKit) {
            setUpNodeList(parent, nodeEntity, nodeClusterBuilder)
        }
    }
    component.runTasks(LifecycleHooks.MOUNTED);
}

function setUpNodeList(parent: DOMNode, renderKit: ListRenderKit, nodeClusterBuilder: NodeClusterBuilder) {
    const { data, initialNodeEntities, renderItem } = renderKit;
    const isDynamic = hasSignal(data);
    const dynamicCluster = isDynamic ? nodeClusterBuilder.appendDynamicCluster() : null;

    for (const nodeEntities of initialNodeEntities) {
        nodeClusterBuilder = dynamicCluster?.appendNodeCluster() || nodeClusterBuilder;
        for (const nodeEntity of nodeEntities) {
            // append to dom and node cluster
            setUpNodeEntity(parent, nodeEntity, nodeClusterBuilder);
        }
    }

    if (isDynamic) {
        // set up watcher for updates
        watchForUpdate(data, (newValue, oldValue) => {
            if (isEqual(newValue, oldValue)) return;
            //TODO: diff and update DOM ... this will be challenging!
            renderItem
        })
    }
}

function setUpConditionalEntity(parent: DOMNode, renderKit: InitialConditionalRenderKit, nodeClusterBuilder: NodeClusterBuilder) {
    const { conditionalKits, initialNodeEntities, $initialConditions, initialIndex } = renderKit;

    const dynamicCluster = nodeClusterBuilder.appendDynamicCluster();

    const _conditionalKits: {
        $condition?: ReactiveSignal<boolean>;
        clusterBuilder: NodeClusterBuilder;
        renderConditional: () => NodeEntity[];
    }[] = []

    for (let i = 0; i < conditionalKits.length; i++) {
        const { renderConditional, $condition } = conditionalKits[i];
        const clusterBuilder = dynamicCluster.appendNodeCluster();
        _conditionalKits.push({ $condition, clusterBuilder, renderConditional });
    }

    for (const nodeEntity of initialNodeEntities) {
        // append to dom and node cluster
        setUpNodeEntity(parent, nodeEntity, _conditionalKits[initialIndex].clusterBuilder)
    }

    //    0                               1    2
    // [[node, [maybe dynamic cluster]], [ ], [ ]] --- dynamic cluster
    //  |                                 |
    //  active cluster                   inactive cluster
    //
    // 
    // [activeKit, kit, kit] --- conditionalKits
    //

    // set up watcher for updates
    watchForUpdate($initialConditions, updateConditional, { once: true })

    function updateConditional(newValue: boolean[], oldValue: boolean[]) {
        if (isEqual(newValue, oldValue)) return;
        const conditions: ReactiveSignal<boolean>[] = [];
        for (const kit of _conditionalKits) {
            const { clusterBuilder, renderConditional, $condition } = kit;
            if ($condition && getWithoutTracking($condition) || !$condition) {
                //TODO:  unmount previous nodes

                if ($condition) conditions.push($condition);
                const nodeEntities = renderConditional();
                for (const nodeEntity of nodeEntities) {
                    setUpNodeEntity(parent, nodeEntity, clusterBuilder)
                }

                watchForUpdate($(() => {
                    const values: boolean[] = [];
                    for (const $condition of conditions) {
                        values.push($condition());
                    }
                    return values;
                }), updateConditional, { once: true })
                break;
            }
        }

    }
}

// function setUpConditionalEntity(parent: DOMNode, renderKit: InitialConditionalRenderKit, nodeClusterBuilder: NodeClusterBuilder) {
//     const dynamicCluster = nodeClusterBuilder.appendDynamicCluster();

//     const { $condition, renderConditional, renderElse, elseIf, initialNodeEntities, $initialConditions, initialIndex } = renderKit; //TODO: renderKit should have conditionalKits
//     let activeClusterBuilder: NodeClusterBuilder;

//     const clusterBuilder = dynamicCluster.appendNodeCluster();
//     const conditionalKits: {
//         $condition?: ReactiveSignal<boolean>;
//         clusterBuilder: NodeClusterBuilder;
//         renderConditional: () => NodeEntity[];
//     }[] = [{ $condition, clusterBuilder, renderConditional }]
//     if (initialIndex === 0) activeClusterBuilder = clusterBuilder;

//     if (elseIf) {
//         for (let i = 0; i < elseIf.length; i++) {
//             const { $condition, renderConditional } = elseIf[i];
//             const clusterBuilder = dynamicCluster.appendNodeCluster();
//             conditionalKits.push({ $condition, clusterBuilder, renderConditional });
//             if (initialIndex === i + 1) activeClusterBuilder = clusterBuilder
//         }
//     }

//     if (renderElse) {
//         const clusterBuilder = dynamicCluster.appendNodeCluster();
//         conditionalKits.push({ clusterBuilder, renderConditional: renderElse })
//     }

//     for (const nodeEntity of initialNodeEntities) {
//         // append to dom and node cluster
//         setUpNodeEntity(parent, nodeEntity, activeClusterBuilder) //FIX: this needs to be the cluster builder of the initial satisfied condition, not the first condition
//     }

//     //    0                               1    2
//     // [[node, [maybe dynamic cluster]], [ ], [ ]] --- dynamic cluster
//     //  |                                 |
//     //  active cluster                   inactive cluster
//     //
//     // 
//     // [activeKit, kit, kit] --- conditionalKits
//     //

//     // set up watcher for updates
//     watchForUpdate($initialConditions, updateConditional, { once: true })

//     function updateConditional(newValue: boolean[], oldValue: boolean[]) {
//         if (!isEqual(newValue, oldValue)) {
//             const conditions: ReactiveSignal<boolean>[] = [];
//             for (const kit of conditionalKits) {
//                 const { clusterBuilder, renderConditional, $condition } = kit;
//                 if ($condition && getWithoutTracking($condition) || !$condition) {
//                     if ($condition) conditions.push($condition);
//                     const nodeEntities = renderConditional();
//                     for (const nodeEntity of nodeEntities) {
//                         setUpNodeEntity(parent, nodeEntity, clusterBuilder)
//                     }

//                     // unmount previous nodes

//                     watchForUpdate($(() => {
//                         const values: boolean[] = [];
//                         for (const $condition of conditions) {
//                             values.push($condition());
//                         }
//                         return values;
//                     }), updateConditional, { once: true })
//                     break;
//                 }
//             }
//         }
//     }
// }

