import { debug } from "@rue/utils";
import { getFlask } from "@rue/flask";
import { afterCreated, afterDemounted, afterDestroyed, afterMounted, afterRemounted, afterUnmounted, atCreate, atCreated, atDemount, atDemounted, atDestroy, atDestroyed, atMount, atMounted, atRemount, atRemounted, atUnmount, atUnmounted } from "./flask-hooks";

type LifecycleTask = (element: Element, initialOrFinal?: boolean) => void;

export function setUpHooks(node: Element, hooks: { [key: string]: LifecycleTask }) {
   const flask = getFlask()
   for (const key in hooks) {
      const task = hooks[key]
      switch (key) {
         case 'at:create':
            atCreate(() => task(node))
            break;

         case 'at:mount':
            atMount((initial) => task(node, initial))
            break;

         case 'at:remount':
            atRemount(() => task(node))
            break;

         case 'at:created':
            atCreated(() => task(node))
            break;

         case 'at:mounted':
            atMounted((initial) => task(node, initial))
            break;

         case 'at:remounted':
            atRemounted(() => task(node))
            break;

         case 'after:created':
            afterCreated(() => task(node))
            break;

         case 'after:mounted':
            afterMounted((initial) => task(node, initial))
            break;

         case 'after:remounted':
            afterRemounted(() => task(node))
            break;

         case 'at:destroy':
            atDestroy(() => task(node))
            break;

         case 'at:unmount':
            atUnmount((initial) => task(node, initial))
            break;

         case 'at:demount':
            atDemount(() => task(node))
            break;

         case 'at:destroyed':
            atDestroyed(() => task(node))
            break;

         case 'at:unmounted':
            atUnmounted((initial) => task(node, initial))
            break;

         case 'at:demounted':
            atDemounted(() => task(node))
            break;

         case 'after:destroyed':
            afterDestroyed(() => task(node))
            break;

         case 'after:unmounted':
            afterUnmounted((initial) => task(node, initial))
            break;

         case 'after:demounted':
            afterDemounted(() => task(node))
            break;

         default:
            debug.error('invalid inline hook')
      }
   }
}


const flaskHooks = {
   'at:create': true,
   'at:mount': true,
   'at:remount': true,

   'at:created': true,
   'at:mounted': true,
   'at:remounted': true,

   'after:created': true,
   'after:mounted': true,
   'after:remounted': true,

   'at:destroy': true,
   'at:unmount': true,
   'at:demount': true,

   'at:destroyed': true,
   'at:unmounted': true,
   'at:demounted': true,

   'after:destroyed': true,
   'after:unmounted': true,
   'after:demounted': true
}

export function isFlaskLifecycleHook(attibuteName: string) {
   //@ts-expect-error
   return flaskHooks[attibuteName]
}
