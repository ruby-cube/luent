import { getActiveFlask } from "@rue/flask";
import { getViewFlask } from "../../../luent/src/flask/ViewFlask";

/**
 * 
 * @param factory (...args: P) => T
 * @returns (...args: P) => T
 * must be called in top level of component or render function for accurate usage count. May not be used in event handlers
 */
export function createService<T, P extends any[]>(factory: (...args: P) => T) {
   let shared: T | undefined;
   let count = 0;

   return (...args: P) => {
      const flask = getViewFlask()
      count++
      flask.onDiscard(() => {
         count--
         if (count === 0) {
            shared = undefined;
         }
      })
      shared ?? (shared = factory(...args))
   }
}