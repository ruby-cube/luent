import { $thisFlask, Flask, getActiveFlask } from "@rue/flask";

export function getActiveDynamicNode() {
   return findDynamicNode(getActiveFlask());
}

export function getDynamicNode(): DynamicNode {
   return findDynamicNode($thisFlask() as Flask);
}

function findDynamicNode(flask: Flask | undefined) {
   do {
      if (flask instanceof DynamicNode) return flask;
      flask = flask?.outer
   }
   while (flask)
   throw new Error('no dynamic node found')
}

export class DynamicNode extends Flask {

   constructor(
      public parent?: DynamicNode,
   ) {
      super(parent)
   }

   fork() {
      return new DynamicNode(this)
   }

   mount(render: () => void) {
      this.collectTasks(render)
      this.activate()
   }

   remount(render: () => void) {
      render();
      this.reactivate()
   }
}


export const NULLISH_DYNAMIC_NODE = new DynamicNode()








