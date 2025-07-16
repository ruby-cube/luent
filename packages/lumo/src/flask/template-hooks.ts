import { getActiveFlask } from "@rue/flask";
import { debug } from "@rue/utils";
import { getViewFlask } from "./ViewFlask";

type LifecycleTask = (element: Element, initialOrFinal: boolean) => void;

export function setUpHooks(node: Element, hooks: { [key: string]: LifecycleTask }) {
   const flask = getViewFlask()
   for (const key in hooks) {
      const task = hooks[key]
      switch (key) {
         case 'at:mounted':
            flask.onInitialMount(() => task(node, true))
            flask.onRemount(() => task(node, false))
            break;
         case 'at:unmount':
            flask.onDemount(() => task(node, false))
            flask.onDiscard(() => task(node, true))
            break;
         default:
            debug.error('invalid inline hook')
      }
   }
}


const flaskHooks = new Set([
   'at:mounted',
   'at:unmount',
])

export function isFlaskLifecycleHook(attibuteName: string) {
   return flaskHooks.has(attibuteName)
}
