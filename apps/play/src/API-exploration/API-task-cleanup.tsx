//@ts-nocheck
import { getActiveFlask } from "@rue/flask";
import { component, fromCommons, RENDER } from "@rue/lumo";
import { queueIonicTask } from "@rue/quarky";

// [ ] async context - commons
//     - nested functions needing commons like IonicTodo
// [X] flask cleanup

// A) make async context as invisible as possible (with compiler, etc) <<----THIS.. it's too ugly to be visible T_T ... but how do we know what to transform?
//    - devs don't have to worry, will take async context access for granted
// B) make async context explicit when needed
//    - devs have to keep in mind, may forget
// C) make async context ALWAYS explicit
//    - devs have to keep in mind


export function ScoreBoard() {

   // synchronous
   ionicSyncTask(() => {

   })

   // prerender
   ionicPreTask(async ({ setup, fromCommons }) => {
      setup(() =>
         setInterval(() => {
            console.log("hi")
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = useSelection(x, y)
      console.log('other stuff', fromCommons(ScoreBoard.stuff))
   })

   ionicRenderTask(async ({ setup, useSelection, IonicTodo }) => {
      setup(() =>
         setInterval(() => {
            console.log("hi")
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = useSelection(x, y)
      const newTodo = IonicTodo(todo)
      console.log('other stuff', fromCommons(ScoreBoard.stuff))

   }, { contextualize: { useSelection, IonicTodo } })

   ionicPostTask(async ({ setup, useSelection, IonicTodo }) => {
      setup(() =>
         setInterval(() => {
            console.log("hi")
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = useSelection(x, y)
      const newTodo = IonicTodo(todo)
      console.log('other stuff', fromCommons(ScoreBoard.stuff))

   }, { contextualize: { useSelection, IonicTodo } })


   return component(<></>)
}

type CleanupFn<T> = (...values: T | [undefined]) => void


function Setup() {

   const flask = getActiveFlask()

   return function setup<T>(setupFn: () => T) {
      let stub = setupFn()
      flask.atRemount(() => stub = setupFn)
      return {
         cleanup(cleanUp?: (stub: T) => void) {
            if (cleanUp) {
               flask.atDemount(() => cleanUp(stub))
               flask.onDiscard(() => cleanUp(stub))
            }
            else {
               if (!(stub instanceof Function) || stub.length !== 0)
                  throw new Error('Must provide a cleanup function that expects no arguments')
               flask.atDemount(stub)
               flask.onDiscard(stub)
            }
         }
      }
   }
}


setup(() =>
   setInterval(() => {
      console.log("hi")
   }, 500)
).cleanup(clearInterval)