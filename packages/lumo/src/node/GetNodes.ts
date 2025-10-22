import { watch } from "@rue/quarky";
import { $Index } from "../iteratives/List";
import { AnyObject } from "@rue/types";


type Nodes = any[] | Nodes[]

// <td nodes={[tds, $row, $cell]}></td>
// const [nodes, ...indices] = config.nodes

export function setUpNodesArray(node: AnyObject, nodes: Nodes, indices: $Index[]) {
   for (let i = 0; i < indices.length; i++) {
      const $index = indices[i]
      watch($index, () => {
         if ($index() === -1) {
            const array = traverseNodes(nodes, i, indices)
            delete array[$index()]
            array.length = $index.dataLength
         }
         else {
            traverseNodes(nodes, i, indices)[$index()] = node
         }
      })
   }
}

function traverseNodes(nodes: Nodes, depth: number, indices: $Index[]) {
   if (depth === 0) return nodes;
   let nestedArray = nodes
   for (let i = 0; i < depth; i++) {
      const $index = indices[i]
      nestedArray = nestedArray[$index()] ?? (nestedArray[$index()] = [] as Nodes)
   }
   return nestedArray;
}