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
         case 'before:mount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeMount(() => task(toValue(node)))
            }
            break;

         case 'before:attach':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeAttach((initial) => task(toValue(node), initial))
            }
            break;

         case 'before:remount':
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

         case 'after:mount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterMount(() => task(toValue(node)))
            }
            break;

         case 'after:attach':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterAttach((initial) => task(toValue(node), initial))
            }
            break;

         case 'after:remount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterRemount(() => task(toValue(node)))
            }
            break;

         case 'before:unmount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeUnmount(() => task(toValue(node)))
            }
            break;

         case 'before:detach':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeDetach((initial) => task(toValue(node), initial))
            }
            break;

         case 'before:demount':
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

         case 'after:unmount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterUnmount(() => task(toValue(node)))
            }
            break;

         case 'after:detach':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterDetach((initial) => task(toValue(node), initial))
            }
            break;

         case 'after:demount':
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
   'before:mount'?: LifecycleTask<T> | LifecycleTask<T>[] | void // allows functions to be called in the JSX expression space
   'before:attach'?: LifecycleTask<T> | LifecycleTask<T>[] | void
   'before:remount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'at:mount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'at:attach'?: LifecycleTask<T> | LifecycleTask<T>[]
   'at:remount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'after:mount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'after:attach'?: LifecycleTask<T> | LifecycleTask<T>[]
   'after:remount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'before:unmount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'before:detach'?: LifecycleTask<T> | LifecycleTask<T>[]
   'before:demount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'at:unmount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'at:detach'?: LifecycleTask<T> | LifecycleTask<T>[]
   'at:demount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'after:unmount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'after:detach'?: LifecycleTask<T> | LifecycleTask<T>[]
   'after:demount'?: LifecycleTask<T> | LifecycleTask<T>[]
}

const flaskHooks = {
   'before:mount': true,
   'before:attach': true,
   'before:remount': true,

   'at:mount': true,
   'at:attach': true,
   'at:remount': true,

   'after:mount': true,
   'after:attach': true,
   'after:remount': true,

   'before:unmount': true,
   'before:detach': true,
   'before:demount': true,

   'at:unmount': true,
   'at:detach': true,
   'at:demount': true,

   'after:unmount': true,
   'after:detach': true,
   'after:demount': true
}

export function isFlaskLifecycleHook(attibuteName: string) {
   //@ts-expect-error
   return flaskHooks[attibuteName]
}
