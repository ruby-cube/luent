import { getActiveFlask } from "@rue/flask";
import { debug } from "@rue/utils";
import { onPostrender, onRender } from "../render-cycle";

type LifecycleTask = (element: Element) => void;



export function setUpHooks(node: Element, hooks: { [key: string]: LifecycleTask }) {
   const flask = getActiveFlask()
   for (const key in hooks) {
      const task = hooks[key]
      switch (key) {
         case 'post:creation':
            flask?.onInitialMount(scheduleForPostlude)
            break;
         case 'post:mount':
            flask?.onInitialMount(scheduleForPostlude)
            flask?.onRemount(scheduleForPostlude)
            break;
         case 'post:remount':
            flask?.onRemount(scheduleForPostlude)
            break;
         case 'post:demount':
            flask?.onDemount(scheduleForPostlude)
            break;
         case 'post:unmount':
            flask?.onDemount(scheduleForPostlude)
            flask?.onDiscard(scheduleForPostlude)
            break;
         case 'post:discard':
            flask?.onDiscard(scheduleForPostlude)
            break;
         case 'at:creation':
            flask?.onInitialMount(scheduleForRender)
            break;
         case 'at:mount':
            flask?.onInitialMount(scheduleForRender)
            flask?.onRemount(scheduleForRender)
            break;
         case 'at:remount':
            flask?.onRemount(scheduleForRender)
            break;
         case 'at:demount':
            flask?.onDemount(scheduleForRender)
            break;
         case 'at:unmount':
            flask?.onDemount(scheduleForRender)
            flask?.onDiscard(scheduleForRender)
            break;
         case 'at:discard':
            flask?.onDiscard(scheduleForRender)
            break;
         case 'pre:creation':
            flask?.onInitialMount(() => task(node))
            break;
         case 'pre:mount':
            flask?.onInitialMount(() => task(node))
            flask?.onRemount(() => task(node))
            break;
         case 'pre:remount':
            flask?.onRemount(() => task(node))
            break;
         case 'pre:demount':
            flask?.onDemount(() => task(node))
            break;
         case 'pre:unmount':
            flask?.onDemount(() => task(node))
            flask?.onDiscard(() => task(node))
            break;
         case 'pre:discard':
            flask?.onDiscard(() => task(node))
            break;
         default:
            debug.error('invalid inline hook')
      }
      function scheduleForRender() {
         onRender(() => task(node))
      }
      function scheduleForPostlude() {
         onPostrender(() => task(node))
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
   'pre:creation',
   'pre:mount',
   'pre:remount',
   'pre:demount',
   'pre:unmount',
   'pre:discard',
   'post:creation',
   'post:mount',
   'post:remount',
   'post:demount',
   'post:unmount',
   'post:discard',
])

export function isFlaskLifecycleHook(attibuteName: string) {
   return flaskHooks.has(attibuteName)
}
