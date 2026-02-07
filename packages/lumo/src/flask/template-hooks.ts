import { debug } from "@rue/utils";
import { getFlask } from "@rue/flask";
import { queueRender } from "../../../quarky/src/reactivity/RenderCycle";
import { atMounted } from "./flask-hooks";

type LifecycleTask = (element: Element, initialOrFinal?: boolean) => void;

export function setUpHooks(node: Element, hooks: { [key: string]: LifecycleTask }) {
   const flask = getFlask()
   for (const key in hooks) {
      const task = hooks[key]
      switch (key) {
         case 'at:mounted':
            atMounted((initial) => task(node, initial))
            break;

         case 'at:mount':
            flask.onInitialMount(() => task(node, false))
            flask.onRemount(() => task(node, true))
            break;

         case 'at:unmount':
            flask.onDemount(() => task(node, false))
            flask.onDiscard(() => task(node, true))
            break;

         case 'at:remounted':
            flask.onRemount(async () => { queueRender(() => task(node)) })
            break;

         case 'at:demount':
            flask.onDemount(() => task(node))
            break;
         default:
            debug.error('invalid inline hook')
      }
   }
}


const flaskHooks = new Set([
   'at:mounted',
   'at:mount',
   'at:unmount',
])

export function isFlaskLifecycleHook(attibuteName: string) {
   return flaskHooks.has(attibuteName)
}
