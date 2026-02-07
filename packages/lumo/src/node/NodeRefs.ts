import { INTERNAL, Ion, isIon, PRELUDE, toValue, watch } from "@rue/quarky";
import { $Index } from "../iteratives/ItemList";
import { AnyObject } from "@rue/types";
import { atUnmount } from "../flask/flask-hooks";
import { getFlask } from "@rue/flask";
import { isFunction } from "@rue/utils";
import { ro } from "date-fns/locale";


type Nodes = any[] | Nodes[]

// <td ref={[tds, $row, $cell]}></td>
// const [nodes, ...indices] = config.nodes

// export function setUpNodesArray(node: AnyObject, nodes: Nodes, indices: $Index[]) {
//    console.log('setting up nodes array')
//    for (let i = 0; i < indices.length; i++) {
//       const $index = indices[i]
//       watch($index, () => {
//          if ($index() === -1) {
//             const array = traverseNodes(nodes, i, indices)
//             delete array[$index()]
//             array.length = $index.dataLength
//          }
//          else {
//             traverseNodes(nodes, i, indices)[$index()] = node
//          }
//       }, {eager: true})
//    }
// }

// function traverseNodes(nodes: Nodes, depth: number, indices: $Index[]) {
//    if (depth === 0) return nodes;
//    let nestedArray = nodes
//    for (let i = 0; i < depth; i++) {
//       const $index = indices[i]
//       nestedArray = nestedArray[$index()] ?? (nestedArray[$index()] = [] as Nodes)
//    }
//    return nestedArray;
// }


type Index = Ion<number> | number

/**
 * Returns a function that can be used to retreive node instance--whether DOM node or component.
 * 
 * @param type 
 * @param levels 
 * @returns 
 */
export function NodeRefs<T>(type: T, levels: number = 1) {
   // let i = levels
   // let $node: ((index: Index) => any) | undefined;
   // let previousLevels: ([any[], Index][]) | undefined;
   // while (i--) {
   //    [$node, previousLevels] = createLevel(i + 1, levels, previousLevels, $node)
   // }
   // return $node

   return createLevel(1, levels, [])
}

// [[td, td], [td, td], [td, td]]

function createLevel(level: number, levels: number, array: any[]) {
   const $next: ((index: Index) => any)[] = []

   function $node(index: Ion<number> | number | 'length', set: 1 | 0 = 1) {
      if (index === 'length') {
         return array.length;
      }
      if (set === 0) {
         const i = toValue(index)
         if (level === levels) {
            return { [INTERNAL]: [array, index] }
         }
         else {
            const $node = $next[i] = createLevel(level + 1, levels, array[i] ?? (array[i] = []))
            return (index: Ion<number> | number) => $node(index, 0)
         }
      }
      else {
         if (level === levels) {
            return array[toValue(index)]
         }
         else {
            return $next[toValue(index)]
         }
      }
   }
   if (level === 1) $node.by = (index: Ion<number> | number) => $node(index, 0)
   return $node
}

export type NodeRefsConfig = { arr: any[], i: Index | Index[] }

// export function setUpNodeRefs(node: any, config: NodeRefsConfig) {
//    const [array, index] = config
//    setUpLevel(node, array, index)
//    // let prevArray;
//    // let i = configs.length
//    // const levels = i
//    // while (i--) {
//    //    if (i === 0) return;
//    //    const level = i + 1;
//    //    console.log('&&& setup level', i)
//    //    const [array, index] = configs[i]
//    //    if (level === levels) {
//    //    }
//    //    else {
//    //       setUpLevel(prevArray, array, index)
//    //    }
//    //    prevArray = array;
//    // }
// }

export function setUpNodeRefs(node: any, root: any[], indices: Index[]) {
   let array = root;
   for (let i = 0; i < indices.length; i++) {
      const index = toValue(indices[i])

      const nestedArray = i === indices.length - 1 ? undefined : array[index] ?? (array[index] = [])
      setUpLevel(i === indices.length - 1 ? node : nestedArray, array, indices[i])
      array = nestedArray
   }
}

function setUpLevel(referent: any, array: any[], index: Ion<number> | number) {
   if (isFunction(index)) {
      watch(index, ({ current: i }) => {
         if (i === -1) {
            array.pop()
         }
         else {
            array[i] = referent
         }
      }, { eager: true, phase: PRELUDE }) // TODO: fix: eager so that it will run even if PRELUDE has passed
   }
   else {
      // TODO: update Thru()
      array[index] = referent
   }
}