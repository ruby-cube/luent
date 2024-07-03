

export function removeDOMNodes(nodes: NodeList, data: string | any[], indicesToRemove: number[]) {
    if (nodes.length !== data.length) throw "NodeList and data length are mismatched"
    const nodesToRemove = [];
    for (const index of indicesToRemove) {
        nodesToRemove.push(<HTMLElement | CharacterData>nodes.item(index))
    }
    for (const node of nodesToRemove) {
        node.remove();
    }
}

export function insertDOMNodes(parent: HTMLElement, newData: string | any[], newItems: Set<any>, lcs: string | any[], createNode: () => Node,) {
    const nodes = parent.childNodes;
    if (nodes.length !== newData.length) throw "NodeList and data length are mismatched"
    let i = 0
    while (i < newData.length) {
        const item = newData[i];
        if (newItems.has(item)) {
            // insert node
            const prevNode = nodes.item(i - 1);
            if (prevNode) {
                prevNode.after(createNode())
            }
            else {
                parent.prepend(createNode())
            }
        }
        else if (lcs.indexOf(item) === -1) {
            // move node
            const prevNode = nodes.item(i - 1);
            if (prevNode) {
                prevNode.after(nodes.item(i))
            }
            else {
                parent.prepend(nodes.item(i))
            }
        }
    }
}