import { afterEffects } from "./render-cycle";

let measureTasks: (() => any)[] | undefined = undefined
let resolvers: ((value: any | PromiseLike<unknown>) => void)[] | undefined = undefined

export function measureLayout<T>(measure: () => T): Promise<T> {
   if (measureTasks) {
      measureTasks.push(measure)
      return new Promise(resolve => {
         resolvers!.push(resolve)
      });
   } else {
      measureTasks = [measure]
      resolvers = []
      afterEffects(() => {
         queueMicrotask(() => {
            for (let i = 0; i < measureTasks!.length; i++) {
               const resolve = resolvers![i]
               resolve(measure())
            }
            measureTasks = undefined;
            resolvers = undefined;
            // emitMeasureLayoutComplete()
         })
      })
      return new Promise((resolve) => {
         resolvers!.push(resolve)
      })
   }
}


// - first mutation creates event cycle: queueMicrotask()
// - reading previous layout OK.
// - to read measurements from the mutation, you must call await afterEffects()


//TODO: what do you do about queueMicrotasks and promises by the dev? It's their responsibility to call it in the appropriate place.
// - provide a queuePS(() => {}) hook that schedules into the effect queue