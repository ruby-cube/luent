import { AnyObject } from "@rue/types";
import { SetKey, Signal } from "../muonic/useSignalize";
import { DOMNode, getCurrentComponent, InternalComponent } from "./component";
import { watchForUpdate } from "./watchForUpdate";
import { $, hasSignal, ReactiveSignal } from "../muonic/useDerivedSignal";
import { getWithoutTracking } from "../muonic/DependencyTracker";
import { ListRenderKit } from "./mxsFor";
import { LifecycleHooks } from "./lifecycle";
import { InitialConditionalRenderKit } from "./mxIf";
import { appendItems, isEqual } from "@rue/utils";


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

function setUpTextNode(parent: HTMLElement, text: ReactiveSignal | string, nodeClusterBuilder?: NodeClusterBuilder, fragment?: DocumentFragment) {
    const textNode = createTextNode(text); //QUESTION: In cases of empty string, should textNode be created? What is more important... clean HTML or less DOM manipulations?
    if (nodeClusterBuilder) {
        nodeClusterBuilder.appendStaticNode(textNode)
    }

    const root = fragment ? fragment : parent;
    root.appendChild(textNode)

    if (hasSignal(text)) {
        keepTextNodeUpdated(text, textNode)
    }
}

// function mountDOMNode(parent: HTMLElement, node: DOMNode, prevSibling?: DOMNode | null) {
//     if (prevSibling) {
//         prevSibling.after(node) //TODO: instead, collect consecutive nodes and mount them together?
//     }
//     else if (prevSibling === null) {
//         parent.prepend(node)
//     }
//     else {
//         parent.appendChild(node);
//     }
// }

function keepTextNodeUpdated($text: ReactiveSignal<string>, textNode: CharacterData) {
    watchForUpdate($text, (newValue) => {
        textNode.data = newValue;
    });
}

function createTextNode(value: ReactiveSignal | string) {
    const text = typeof value === "string" ? value : getWithoutTracking(value);
    const textNode = document.createTextNode(text);
    return textNode;
}

// function mountNode(parent: DOMNode, node: DOMNode) {
//     parent.appendChild(node);
// }

// function mountNodes(parent: DOMNode, nodes: (DOMNode | DOMNode[])[]) {
//     for (const nodeOrGroup of nodes) {
//         if (nodeOrGroup instanceof Array) {
//             mountNodes(parent, nodeOrGroup);
//         }
//         else {
//             parent.appendChild(nodeOrGroup);
//         }
//     }
// }

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
    private _activeComponents: InternalComponent[] = []

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

    replaceNodeCluster(index: number, nodeCluster: NodeCluster) {
        this.cluster[index] = nodeCluster;
    }

    removeNodeClusters(index: number, deleteCount: number) {
        this.cluster.splice(index, deleteCount)
    }

    insertNodeClusters(index: number, ...nodeClusters: NodeCluster[]) {
        this.cluster.splice(index, 0, ...nodeClusters)
    }

    includeComponent(component: InternalComponent) {
        this._activeComponents.push(component);
    }

    includeComponents(components: InternalComponent[]) {
        const activeComponents = this._activeComponents
        activeComponents.splice(activeComponents.length, 0, ...components)
    }

    clearComponents() {
        this._activeComponents = [];
    }

    get activeComponents() {
        return this._activeComponents;
    }
}

function setUpNodeEntity(parent: HTMLElement, nodeEntity: NodeEntity, clusterBuilder: NodeClusterBuilder, dynamicCluster?: DynamicNodeCluster, fragment?: DocumentFragment) {
    if (typeof nodeEntity === "string" || hasSignal(nodeEntity)) {
        setUpTextNode(parent, nodeEntity, clusterBuilder, fragment)
    }
    else if (nodeEntity instanceof Node) { // from Web API
        setUpNode(parent, nodeEntity, clusterBuilder, fragment)
    }
    else if (nodeEntity instanceof InternalComponent) {
        setUpComponent(parent, nodeEntity, clusterBuilder, dynamicCluster, fragment) //QUESTION: not sure if this needs updateMode passed in
        if (dynamicCluster) dynamicCluster.includeComponent(nodeEntity);
    }
    else if (nodeEntity instanceof ListRenderKit) { // this may or may not be dynamic, depending on data
        setUpNodeList(parent, nodeEntity, clusterBuilder, dynamicCluster, fragment);
    }
    else if (nodeEntity instanceof InitialConditionalRenderKit) {
        setUpConditionalEntity(parent, nodeEntity, clusterBuilder, dynamicCluster, fragment)
    }
    else {
        throw new Error("Invalid input")
    }
}



function setUpNode(parent: HTMLElement, node: DOMNode, nodeClusterBuilder: NodeClusterBuilder, fragment?: DocumentFragment) {
    nodeClusterBuilder.appendStaticNode(node)
    const root = fragment ? fragment : parent;
    root.appendChild(node)
}



function setUpComponent(parent: HTMLElement, component: InternalComponent, nodeClusterBuilder: NodeClusterBuilder, dynamicCluster?: DynamicNodeCluster, fragment?: DocumentFragment) { //TODO: what if a component's root elements is conditional or a dynamic list??
    const nodeEntities = component.initialNodeEntities;
    if (!(parent instanceof HTMLElement)) throw new Error("Parent cannot be a text node")
    const root = fragment ? fragment : parent;
    if (!fragment) component.emit(LifecycleHooks.BEFORE_MOUNT);
    for (const nodeEntity of nodeEntities) {
        if (nodeEntity instanceof Node) {
            root.appendChild(nodeEntity);
            nodeClusterBuilder.appendStaticNode(nodeEntity)
        }
        else if (nodeEntity instanceof ListRenderKit) {
            setUpNodeList(parent, nodeEntity, nodeClusterBuilder, dynamicCluster, fragment)
        }
    }
    if (!fragment) component.emit(LifecycleHooks.MOUNTED);
}

function setUpNodeList(parent: HTMLElement, renderKit: ListRenderKit, nodeClusterBuilder: NodeClusterBuilder, dynamicCluster?: DynamicNodeCluster, fragment?: DocumentFragment) {
    const { data, initialNodeEntities, renderItem } = renderKit;
    const isDynamic = hasSignal(data);
    const _dynamicCluster = isDynamic ? nodeClusterBuilder.appendDynamicCluster() : undefined;

    for (const nodeEntities of initialNodeEntities) {
        nodeClusterBuilder = _dynamicCluster?.appendNodeCluster() || nodeClusterBuilder;
        for (const nodeEntity of nodeEntities) {
            // append to dom and node cluster
            setUpNodeEntity(parent, nodeEntity, nodeClusterBuilder, _dynamicCluster, fragment);
        }
    }

    if (dynamicCluster && _dynamicCluster) dynamicCluster.includeComponents(_dynamicCluster.activeComponents)


    if (isDynamic) {
        // set up watcher for updates
        watchForUpdate(data, (newValue, oldValue) => {
            if (isEqual(newValue, oldValue)) return;
            //TODO: diff and update DOM ... this will be challenging!
            renderItem
        })
    }
}

const UPDATE_MODE = true;

function setUpConditionalEntity(parent: HTMLElement, renderKit: InitialConditionalRenderKit, nodeClusterBuilder: NodeClusterBuilder, dynamicCluster?: DynamicNodeCluster, fragment?: DocumentFragment) {
    const { conditionalKits, initialNodeEntities, $initialConditions, initialIndex } = renderKit;

    let activeIndex = initialIndex;

    const _dynamicCluster = nodeClusterBuilder.appendDynamicCluster();

    const _conditionalKits: {
        $condition?: ReactiveSignal<boolean>;
        clusterBuilder: NodeClusterBuilder;
        renderConditional: () => NodeEntity[];
    }[] = []

    for (let i = 0; i < conditionalKits.length; i++) {
        const { renderConditional, $condition } = conditionalKits[i];
        const clusterBuilder = _dynamicCluster.appendNodeCluster();
        _conditionalKits.push({ $condition, clusterBuilder, renderConditional });
    }

    for (const nodeEntity of initialNodeEntities) {
        // append to dom and node cluster
        setUpNodeEntity(parent, nodeEntity, _conditionalKits[initialIndex].clusterBuilder, _dynamicCluster, fragment)
    }
    if (dynamicCluster && _dynamicCluster) dynamicCluster.includeComponents(_dynamicCluster.activeComponents) // aggregate components to unmount

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
        for (let i = 0; i < conditionalKits.length; i++) {
            const kit = conditionalKits[i]
            const { renderConditional, $condition } = kit;
            if ($condition) conditions.push($condition);
            if ($condition && getWithoutTracking($condition) || !$condition) {
                //unmount previous nodes
                removeConditionalNodes(_dynamicCluster, activeIndex);
                _dynamicCluster.clearComponents();
                _dynamicCluster.replaceNodeCluster(activeIndex, []); // clears previous

                // mount new nodes
                activeIndex = i;
                const clusterBuilder = new NodeClusterBuilder();
                _dynamicCluster.replaceNodeCluster(activeIndex, clusterBuilder.cluster);

                const nodeEntities = renderConditional();
                const fragment = new DocumentFragment()
                for (const nodeEntity of nodeEntities) {
                    setUpNodeEntity(parent, nodeEntity, clusterBuilder, _dynamicCluster, fragment)
                }
                insertConditionalNodes(parent, _dynamicCluster, fragment)
                break;
            }
        }
        watchForUpdate($(() => {
            const values: boolean[] = [];
            for (const $condition of conditions) {
                values.push($condition());
            }
            return values;
        }), updateConditional, { once: true })

    }
}

function emitHookBatch(hookName: LifecycleHooks, components: InternalComponent[]) {
    for (const compo of components) {
        compo.emit(hookName);
    }
}

function removeConditionalNodes(dynamicCluster: DynamicNodeCluster, activeIndex: number) {
    const nodeCluster = dynamicCluster.get()[activeIndex];
    const components = dynamicCluster.activeComponents;
    emitHookBatch(LifecycleHooks.BEFORE_UNMOUNT, components)
    removeNodes(nodeCluster)
    emitHookBatch(LifecycleHooks.UNMOUNTED, components)
}

function removeNodes(nodeCluster: NodeCluster) {
    for (const nodeEntity of nodeCluster) {
        if (nodeEntity instanceof DynamicNodeCluster) {
            const nodeClusters = nodeEntity.get()
            for (const nodeCluster of nodeClusters) {
                removeNodes(nodeCluster) // What if there were components nested here? how do you unmount them?
            }
        }
        else {
            nodeEntity.remove()
        }
    }
}

function insertConditionalNodes(parent: HTMLElement, dynamicCluster: DynamicNodeCluster, fragment: DocumentFragment) {
    const components = dynamicCluster.activeComponents;
    emitHookBatch(LifecycleHooks.BEFORE_MOUNT, components)
    let prevSibling = dynamicCluster.prevNode;
    if (prevSibling) prevSibling.after(fragment)
    else parent.prepend(fragment)
    emitHookBatch(LifecycleHooks.MOUNTED, components)
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

