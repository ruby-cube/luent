import { debug, isFunction } from "@rue/utils";
import { getFlask } from "@rue/flask";
import { afterCreated, afterDemounted, afterDiscarded, afterMounted, afterRemounted, afterUnmounted, atCreate, atCreated, atDemount, atDemounted, atDiscard, atDiscarded, atMount, atMounted, atRemount, atRemounted, atUnmount, atUnmounted } from "./flask-hooks";
import { AnyObject } from "@rue/types";

type LifecycleTask<T = any> = (element: T, initialOrFinal?: boolean) => void;

export function setUpHooks(node: AnyObject, hooks: { [key: string]: LifecycleTask }) {
   const flask = getFlask()
   for (const key in hooks) {
      const task = hooks[key]
      if (!isFunction(task))continue;
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

         case 'at:discard':
            atDiscard(() => task(node))
            break;

         case 'at:unmount':
            atUnmount((initial) => task(node, initial))
            break;

         case 'at:demount':
            atDemount(() => task(node))
            break;

         case 'at:discarded':
            atDiscarded(() => task(node))
            break;

         case 'at:unmounted':
            atUnmounted((initial) => task(node, initial))
            break;

         case 'at:demounted':
            atDemounted(() => task(node))
            break;

         case 'after:discarded':
            afterDiscarded(() => task(node))
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

   export interface LumoHooks<T> {
      'at:create'?: LifecycleTask<T> | any
      'at:mount'?: LifecycleTask<T>
      'at:remount'?: LifecycleTask<T>
      'at:created'?: LifecycleTask<T>
      'at:mounted'?: LifecycleTask<T>
      'at:remounted'?: LifecycleTask<T>
      'after:created'?: LifecycleTask<T>
      'after:mounted'?: LifecycleTask<T>
      'after:remounted'?: LifecycleTask<T>
      'at:discard'?: LifecycleTask<T>
      'at:unmount'?: LifecycleTask<T>
      'at:demount'?: LifecycleTask<T>
      'at:discarded'?: LifecycleTask<T>
      'at:unmounted'?: LifecycleTask<T>
      'at:demounted'?: LifecycleTask<T>
      'after:discarded'?: LifecycleTask<T>
      'after:unmounted'?: LifecycleTask<T>
      'after:demounted'?: LifecycleTask<T>
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

   'at:discard': true,
   'at:unmount': true,
   'at:demount': true,

   'at:discarded': true,
   'at:unmounted': true,
   'at:demounted': true,

   'after:discarded': true,
   'after:unmounted': true,
   'after:demounted': true
}

export function isFlaskLifecycleHook(attibuteName: string) {
   //@ts-expect-error
   return flaskHooks[attibuteName]
}
