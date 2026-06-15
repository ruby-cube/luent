import { debug, isFunction, normalizeToArray } from "@rue/utils";
import { afterMount, afterDemount, afterUnmount, afterAttach, afterRemount, afterDetach, beforeMount, atMount, beforeDemount, atDemount, beforeUnmount, atUnmount, beforeAttach, atAttach, beforeRemount, atRemount, beforeDetach, atDetach } from "./flask-hooks";
import { AnyObject } from "@rue/types";
import { toValue } from "@rue/quarky";

type LifecycleTask<T = any> = (element: T, initialOrFinal?: boolean) => void;

export function setUpHooks(node: AnyObject, hooks: { [key: string]: LifecycleTask | LifecycleTask[] }) {
   for (const key in hooks) {
      const value = hooks[key]
      if (!isFunction(value) && !(Array.isArray(value))) continue;
      const tasks = normalizeToArray(value)
      switch (key) {
         case 'pre:mount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeMount(() => task(toValue(node)))
            }
            break;

         case 'pre:attach':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeAttach((initial) => task(toValue(node), initial))
            }
            break;

         case 'pre:remount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeRemount(() => task(toValue(node)))
            }
            break;

         case 'at:mount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atMount(() => task(toValue(node)))
            }
            break;

         case 'at:attach':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atAttach((initial) => task(toValue(node), initial))
            }
            break;

         case 'at:remount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atRemount(() => task(toValue(node)))
            }
            break;

         case 'post:mount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterMount(() => task(toValue(node)))
            }
            break;

         case 'post:attach':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterAttach((initial) => task(toValue(node), initial))
            }
            break;

         case 'post:remount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterRemount(() => task(toValue(node)))
            }
            break;

         case 'pre:unmount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeUnmount(() => task(toValue(node)))
            }
            break;

         case 'pre:detach':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeDetach((initial) => task(toValue(node), initial))
            }
            break;

         case 'pre:demount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeDemount(() => task(toValue(node)))
            }
            break;

         case 'at:unmount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atUnmount(() => task(toValue(node)))
            }
            break;

         case 'at:detach':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atDetach((initial) => task(toValue(node), initial))
            }
            break;

         case 'at:demount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atDemount(() => task(toValue(node)))
            }
            break;

         case 'post:unmount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterUnmount(() => task(toValue(node)))
            }
            break;

         case 'post:detach':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterDetach((initial) => task(toValue(node), initial))
            }
            break;

         case 'post:demount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterDemount(() => task(toValue(node)))
            }
            break;

         default:
            debug.error('invalid inline hook')
      }
   }
}



export interface LuentHooks<T> {
   'pre:mount'?: LifecycleTask<T> | LifecycleTask<T>[] | void // allows functions to be called in the JSX expression space
   'pre:attach'?: LifecycleTask<T> | LifecycleTask<T>[] | void
   'pre:remount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'at:mount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'at:attach'?: LifecycleTask<T> | LifecycleTask<T>[]
   'at:remount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'post:mount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'post:attach'?: LifecycleTask<T> | LifecycleTask<T>[]
   'post:remount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'pre:unmount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'pre:detach'?: LifecycleTask<T> | LifecycleTask<T>[]
   'pre:demount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'at:unmount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'at:detach'?: LifecycleTask<T> | LifecycleTask<T>[]
   'at:demount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'post:unmount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'post:detach'?: LifecycleTask<T> | LifecycleTask<T>[]
   'post:demount'?: LifecycleTask<T> | LifecycleTask<T>[]
}

const flaskHooks = {
   'pre:mount': true,
   'pre:attach': true,
   'pre:remount': true,

   'at:mount': true,
   'at:attach': true,
   'at:remount': true,

   'post:mount': true,
   'post:attach': true,
   'post:remount': true,

   'pre:unmount': true,
   'pre:detach': true,
   'pre:demount': true,

   'at:unmount': true,
   'at:detach': true,
   'at:demount': true,

   'post:unmount': true,
   'post:detach': true,
   'post:demount': true
}

export function isFlaskLifecycleHook(attibuteName: string) {
   //@ts-expect-error
   return flaskHooks[attibuteName]
}
