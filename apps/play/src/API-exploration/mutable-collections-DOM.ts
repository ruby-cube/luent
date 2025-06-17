// collection mutation to array mutation

import { NodeEntity, NodePod } from "@rue/lumo";
import { Ion } from "@rue/quarky";

// mutable structure: Set


enrollMutableCollection(Set, {
   add: {
      mutateArray(array: unknown[], { target, input: [value], preopData: { prevSize } }: {
         target: Set<unknown>,
         input: [unknown]
         output: Set<unknown>
         preopData: { prevSize: number }
      }) {
         if (prevSize === target.size) return;
         array.push(value) // array is a proxy for nodepod and dom manipulation
      }
   }
})

function enrollMutableCollection(constructor: any, config: any) {

}

const toDOMMutation = {
   push({ input: [value], nodePod, renderFunction, $index }: { nodePod: NodePod, $index: Ion<number>, input: [unknown], renderFunction: (item: unknown, $index: Ion<number>) => NodeEntity }) {
      const nodeEntities = renderFunction(value, $index)
      nodePod

      
   }
}

// public target: MutableEntity, //QUESTION: make sure these are readonly? Do I want these exposed to app devs? or just for internal use?
// public op: '[[set]]' | PropertyKey,
// public args: [PropertyKey, unknown] | unknown[],
// public output: unknown,
// public preopData: undefined| unknown // old state for [[set]] ops

// array mutation to DOM mutation