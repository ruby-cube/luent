import { debug, isFunction, normalizeToArray } from "@rue/utils";
import { afterInstall, afterDemount, afterUninstall, afterMount, afterRemount, afterUnmount, beforeInstall, atInstall, beforeDemount, atDemount, beforeUninstall, atUninstall, beforeMount, atMount, beforeRemount, atRemount, beforeUnmount, atUnmount } from "./flask-hooks";
import { AnyObject } from "@rue/types";
import { toValue } from "@rue/quarky";

type LifecycleTask<T = any> = (element: T, initialOrFinal?: boolean) => void;

export function setUpHooks(node: AnyObject, hooks: { [key: string]: LifecycleTask | LifecycleTask[] }) {
   for (const key in hooks) {
      const value = hooks[key]
      if (!isFunction(value) && !(Array.isArray(value))) continue;
      const tasks = normalizeToArray(value)
      switch (key) {
         case 'pre:install':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeInstall(() => task(toValue(node)))
            }
            break;

         case 'pre:mount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeMount((initial) => task(toValue(node), initial))
            }
            break;

         case 'pre:remount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeRemount(() => task(toValue(node)))
            }
            break;

         case 'at:install':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atInstall(() => task(toValue(node)))
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

         case 'post:install':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterInstall(() => task(toValue(node)))
            }
            break;

         case 'post:mount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterMount((initial) => task(toValue(node), initial))
            }
            break;

         case 'post:remount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterRemount(() => task(toValue(node)))
            }
            break;

         case 'pre:uninstall':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeUninstall(() => task(toValue(node)))
            }
            break;

         case 'pre:unmount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeUnmount((initial) => task(toValue(node), initial))
            }
            break;

         case 'pre:demount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               beforeDemount(() => task(toValue(node)))
            }
            break;

         case 'at:uninstall':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               atUninstall(() => task(toValue(node)))
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

         case 'post:uninstall':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterUninstall(() => task(toValue(node)))
            }
            break;

         case 'post:unmount':
            for (const task of tasks) {
               if (!isFunction(task)) continue;
               afterUnmount((initial) => task(toValue(node), initial))
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
   'pre:install'?: LifecycleTask<T> | LifecycleTask<T>[] | void // allows functions to be called in the JSX expression space
   'pre:mount'?: LifecycleTask<T> | LifecycleTask<T>[] | void
   'pre:remount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'at:install'?: LifecycleTask<T> | LifecycleTask<T>[]
   'at:mount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'at:remount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'post:install'?: LifecycleTask<T> | LifecycleTask<T>[]
   'post:mount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'post:remount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'pre:uninstall'?: LifecycleTask<T> | LifecycleTask<T>[]
   'pre:unmount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'pre:demount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'at:uninstall'?: LifecycleTask<T> | LifecycleTask<T>[]
   'at:unmount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'at:demount'?: LifecycleTask<T> | LifecycleTask<T>[]

   'post:uninstall'?: LifecycleTask<T> | LifecycleTask<T>[]
   'post:unmount'?: LifecycleTask<T> | LifecycleTask<T>[]
   'post:demount'?: LifecycleTask<T> | LifecycleTask<T>[]
}

const flaskHooks = {
   'pre:install': true,
   'pre:mount': true,
   'pre:remount': true,

   'at:install': true,
   'at:mount': true,
   'at:remount': true,

   'post:install': true,
   'post:mount': true,
   'post:remount': true,

   'pre:uninstall': true,
   'pre:unmount': true,
   'pre:demount': true,

   'at:uninstall': true,
   'at:unmount': true,
   'at:demount': true,

   'post:uninstall': true,
   'post:unmount': true,
   'post:demount': true
}

export function isFlaskLifecycleHook(attibuteName: string) {
   //@ts-expect-error
   return flaskHooks[attibuteName]
}
