

type DocNode = {
    visible: boolean;
    tag: string;
    childNodes: DocNode[];
}

type Signal<T> = (value?: T | typeof NO_ARG) => T

const defaultDocNode = {
    visible: true
}


export function appendChildNodes(node: DocNode, childNodes: DocNode[]) {
    return [...node.childNodes, ...childNodes];
}

function setTag(node: DocNode, tag: string) { // a setter function is only needed if you need validation logic
    if (!node.visible) return node.tag;
    return tag;
}

const patchMap: Map<Signal<any>, { [key: string]: any }> = new Map();

const NO_ARG = Symbol("no arg")
type NoArg = typeof NO_ARG;

export function $<T>(value: T): Signal<T> {
    let _value = value;
    const $signal = (value: T | NoArg = NO_ARG) => {
        if (value === NO_ARG) return _value;
        _value = value;
        return _value;
    }
    patchMap.set($signal, {});
    return $signal;
}



const $node = $<DocNode>({
    visible: defaultDocNode.visible,
    tag: "p",
    childNodes: []
})



$node({
    ...$node(),
    childNodes: appendChildNodes($node(), [$textNode()])
})


// batch changes

function doesStuffAndSetsVisibility($node: Signal<DocNode>) {

}

function doesStuffAndAppendsChildnodes($node: Signal<DocNode>) {

}



function queuePatch($signal: Signal<{ [key: string]: any }>, changes: { [key: string]: any }) {
    const patches = patchMap.get($signal);
    patchMap.set($signal, { ...patches, ...changes })
}


function applyPatches($signal: Signal<{ [key: string]: any }>) {
    const patches = patchMap.get($signal);
}

//TODO: figure out how to work with arrays and non-signals


// the trouble with immutability is
// - to prevent creating a new object with every change, you need to batch, 
// - but if you batch, you can't work with updated values 

// what about properties that are unchangeable but depend on another property?


