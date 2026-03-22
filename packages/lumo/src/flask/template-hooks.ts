import { debug, isFunction, normalizeToArray } from "@rue/utils";
import { getFlask } from "@rue/flask";
import { afterCreated, afterDemounted, afterDiscarded, afterMounted, afterRemounted, afterUnmounted, atCreate, atCreated, atDemount, atDemounted, atDiscard, atDiscarded, atMount, atMounted, atRemount, atRemounted, atUnmount, atUnmounted } from "./flask-hooks";
import { AnyObject } from "@rue/types";
import { toValue } from "@rue/quarky";

type LifecycleTask<T = any> = (element: T, initialOrFinal?: boolean) => void;

export function setUpHooks(node: AnyObject, hooks: { [key: string]: LifecycleTask | LifecycleTask[] }) {
   console.log('setUpHooks: node', node)
   const flask = getFlask()
   for (const key in hooks) {
      const value = hooks[key]
      if (!isFunction(value) && !(value instanceof Array)) continue;
      const tasks = normalizeToArray(value)
      switch (key) {
         case 'at:create':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atCreate(() => task(toValue(node)))
            }
            break;

         case 'at:mount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atMount((initial) => task(toValue(node), initial))
            }
            break;

         case 'at:remount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atRemount(() => task(toValue(node)))
            }
            break;

         case 'at:created':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atCreated(() => task(toValue(node)))
            }
            break;

         case 'at:mounted':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atMounted((initial) => task(toValue(node), initial))
            }
            break;

         case 'at:remounted':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atRemounted(() => task(toValue(node)))
            }
            break;

         case 'after:created':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterCreated(() => task(toValue(node)))
            }
            break;

         case 'after:mounted':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterMounted((initial) => task(toValue(node), initial))
            }
            break;

         case 'after:remounted':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterRemounted(() => task(toValue(node)))
            }
            break;

         case 'at:discard':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atDiscard(() => task(toValue(node)))
            }
            break;

         case 'at:unmount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atUnmount((initial) => task(toValue(node), initial))
            }
            break;

         case 'at:demount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atDemount(() => task(toValue(node)))
            }
            break;

         case 'at:discarded':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atDiscarded(() => task(toValue(node)))
            }
            break;

         case 'at:unmounted':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atUnmounted((initial) => task(toValue(node), initial))
            }
            break;

         case 'at:demounted':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atDemounted(() => task(toValue(node)))
            }
            break;

         case 'after:discarded':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterDiscarded(() => task(toValue(node)))
            }
            break;

         case 'after:unmounted':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterUnmounted((initial) => task(toValue(node), initial))
            }
            break;

         case 'after:demounted':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterDemounted(() => task(toValue(node)))
            }
            break;

         default:
            debug.error('invalid inline hook')
      }
   }
}



export interface LumoHooks<T> {
   'at:create'?: LifecycleTask<T> | LifecycleTask<T>[]| void // allows functions to be called in the JSX expression space
   'at:mount'?: LifecycleTask<T> | LifecycleTask<T>[]| void
   'at:remount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'at:created'?: LifecycleTask<T>| LifecycleTask<T>[]
   'at:mounted'?: LifecycleTask<T>| LifecycleTask<T>[]
   'at:remounted'?: LifecycleTask<T>| LifecycleTask<T>[]
   'after:created'?: LifecycleTask<T>| LifecycleTask<T>[]
   'after:mounted'?: LifecycleTask<T>| LifecycleTask<T>[]
   'after:remounted'?: LifecycleTask<T>| LifecycleTask<T>[]
   'at:discard'?: LifecycleTask<T>| LifecycleTask<T>[]
   'at:unmount'?: LifecycleTask<T>| LifecycleTask<T>[]
   'at:demount'?: LifecycleTask<T>| LifecycleTask<T>[]
   'at:discarded'?: LifecycleTask<T>| LifecycleTask<T>[]
   'at:unmounted'?: LifecycleTask<T>| LifecycleTask<T>[]
   'at:demounted'?: LifecycleTask<T>| LifecycleTask<T>[]
   'after:discarded'?: LifecycleTask<T>| LifecycleTask<T>[]
   'after:unmounted'?: LifecycleTask<T>| LifecycleTask<T>[]
   'after:demounted'?: LifecycleTask<T>| LifecycleTask<T>[]
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
