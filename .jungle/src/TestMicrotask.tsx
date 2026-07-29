import { queueTask } from "@luent/quarky"
import { createStack, noop } from "@luent/utils"

const [push, pop] = createStack()

export function compareTaskPromise() {
   testTask()
   testPromise()
   testPromise()
   testTask()
   testPromise()
   testTask()
   testTask()
   testPromise()
}

function testTask() {
   const tasks: (() => void)[] = []
   let taskCount = 729
   while (taskCount--) {
      tasks.push(() => {
         push('a')
         0
         pop()
      })
   }

   queueTask(() => {
      for (const task of tasks) {
         task()
      }
   })
}

function testPromise() {
   let resolve: (value: void) => void = noop
   const promise = new Promise<void>(_resolve => {
      resolve = _resolve
   })
   let promiseCount = 729
   while (promiseCount--) {
      promise.then(() => {
         push('a')
         0
         pop()
      })
   }

   queueTask(() => {
      resolve()
   })
}