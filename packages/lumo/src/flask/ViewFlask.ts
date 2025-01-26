import { $thisFlask, Flask, getActiveFlask } from "@rue/flask";

export function getActiveViewFlask() {
   return findViewFlask(getActiveFlask());
}

export function getViewFlask(): Flask {
   const flask = getActiveViewFlask()
   if (!flask) throw Error('no dynamic node found')
   return flask;
}

function findViewFlask(flask: Flask | undefined) {
   do {
      if (flask?.type === 'view') return flask;
      flask = flask?.outer
   }
   while (flask)
   throw new Error('no view flask found')
}

// export class DynamicNode extends Flask {

//    constructor(public parent?: DynamicNode
//    ) {
//       super(parent)
//    }

//    fork() {
//       return new DynamicNode(this)
//    }

//    //QUESTION: Should dynamic node handle removing domnodes??
// }


// export const NULLISH_DYNAMIC_NODE = new DynamicNode()








