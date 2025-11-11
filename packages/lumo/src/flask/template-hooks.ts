import { debug } from "@rue/utils";
import { getFlask } from "@rue/flask";
import { queueRenderTask } from "../../../quarky/src/reactivity/RenderCycle";

type LifecycleTask = (element: Element, initialOrFinal?: boolean) => void;

export function setUpHooks(node: Element, hooks: { [key: string]: LifecycleTask }) {
   const flask = getFlask()
   for (const key in hooks) {
      const task = hooks[key]
      switch (key) {
         case 'at:mounted':
            flask.onInitialMount(async () => { queueRenderTask(()=>task(node, true)) })
            flask.onRemount(async () => { queueRenderTask(()=>task(node, false))})
            break;

         case 'at:unmount':
            flask.onDemount(() => task(node, false))
            flask.onDiscard(() => task(node, true))
            break;

         case 'at:remounted':
            flask.onRemount(async () => { queueRenderTask(()=>task(node))})
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
   'at:unmount',
])

export function isFlaskLifecycleHook(attibuteName: string) {
   return flaskHooks.has(attibuteName)
}
