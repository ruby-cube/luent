import { createStack } from "./context/AsyncContext";

const flaskStack = createStack<Flask>({
   name: 'flask',
   getParent(node) {
      return node?.outer;
   }
})

export function pushFlask(flask: Flask) {
   return flaskStack.push(flask)
}

export function popFlask() {
   return flaskStack.pop()
}

export function getActiveFlask() {
   return flaskStack.getActiveNode()
}

export function onFlaskDiscard(task: Task) {
   const flask = getActiveFlask();
   if (!flask) return;
   return flask.onDiscard(task);
}

type Task = () => void

export class Flask {
   discard: () => void;
   onDiscard: (task: Task) => { cancel(): void; };

   constructor(public outer: Flask | undefined = getActiveFlask()) {
      const tasks: Set<Task> = new Set()
      let called = false;

      // defining discard and onDiscard per instances makes it cleaner to 
      // pass them into { until: flask.onDiscard } and flask.onDiscard(outer.discard)
      // without worrying about `this`

      this.discard = () => {
         if (called) return;
         called = true;
         for (const cleanUp of tasks) {
            cleanUp();
         }
      }

      this.onDiscard = (cleanUp: () => void) => {
         tasks.add(cleanUp);
         return {
            cancel() {
               tasks.delete(cleanUp)
            }
         }
      }
   }
}


export function collectEffects<T>(run: (flask: Flask, outerFlask: Flask | null) => T) {
   try {
      const flask = new Flask();
      pushFlask(flask);
      return run(flask, flask.outer || null);
   }
   catch {
      popFlask();
   }
}
