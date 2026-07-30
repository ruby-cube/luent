

export type AbortSignal = (remove?: RemoveTask) => void
type RemoveTask = () => void

// TODO: make sure RemoveTask doesn't cause memory leak?
export function AbortSignal(): AbortSignal {
   // const controller = new AbortController()
   let tasks: RemoveTask[] = []

   return function abortSignal(remove?: RemoveTask) {
      if (remove) {
         tasks.push(remove)
      }
      else {
         for (const task of tasks) {
            task()
         }
         tasks = []
      }
   }
}