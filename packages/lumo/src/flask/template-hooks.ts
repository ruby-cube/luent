import { debug } from "@rue/utils";
import { $renderphase } from "../render-cycle";
import { getFlask } from "@rue/flask";

type LifecycleTask = (element: Element, initialOrFinal: boolean) => void;

export function setUpHooks(node: Element, hooks: { [key: string]: LifecycleTask }) {
   const flask = getFlask()
   for (const key in hooks) {
      const task = hooks[key]
      switch (key) {
         case 'at:mounted':
            flask.onInitialMount(async () => { await $renderphase(); task(node, true) })
            flask.onRemount(async () => { await $renderphase(); task(node, true) })
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
