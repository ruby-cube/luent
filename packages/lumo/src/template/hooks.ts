import { getActiveFlask } from "@rue/flask";
import { debug } from "@rue/utils";

type LifecycleTask = (element: Element) => void;

export function setUpHooks(node: Element, hooks: { [key: string]: LifecycleTask }) {
   const flask = getActiveFlask()
   for (const key in hooks) {
      const task = hooks[key]
      switch (key) {
         case 'creation':
            flask?.onInitialMount(() => task(node))
            break;
         case 'mount':
            flask?.onInitialMount(() => task(node))
            flask?.onRemount(() => task(node))
            break;
         case 'remount':
            flask?.onRemount(() => task(node))
            break;
         case 'demount':
            flask?.onDemount(() => task(node))
            break;
         case 'unmount':
            flask?.onDemount(() => task(node))
            flask?.onDiscard(() => task(node))
            break;
         case 'discard':
            flask?.onDiscard(() => task(node))
            break;
         default:
            debug.error('invalid inline hook')
      }
   }
}

const flaskHooks = new Set([
   'at:creation',
   'at:mount',
   'at:remount',
   'at:demount',
   'at:unmount',
   'at:discard',
])

export function isFlaskLifecycleHook(attibuteName: string){
   return flaskHooks.has(attibuteName)
}