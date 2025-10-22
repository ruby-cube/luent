//@ts-nocheck
import { getActiveFlask } from "@rue/flask";
import { component, fromNub, RENDER } from "@rue/lumo";
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
   ionicPreTask(async ({ setup, fromNub }) => {
      setup(() =>
         setInterval(() => {
            console.log("hi")
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = useSelection(x, y)
      console.log('other stuff', fromNub(ScoreBoard.stuff))
   })

   ionicRenderTask(async ({ setup, ctxz }) => {
      setup(() =>
         setInterval(() => {
            console.log("hi")
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = ctxz(() => useSelection(x, y))
      const newTodo = ctxz(() => IonicTodo(todo))
      console.log('other stuff', fromNub(ScoreBoard.stuff))
   })

   ionicRenderTask(async ({ setup, cxz }) => {
      setup(() =>
         setInterval(() => {
            console.log("hi")
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = cxz(useSelection(x, y))
      const newTodo = cxz(IonicTodo(todo))
      console.log('other stuff', fromNub(ScoreBoard.stuff))
   })

   ionicRenderTask(async ({ setup, cxz }) => {
      setup(() =>
         setInterval(() => {
            console.log("hi")
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = cxz(useSelection)(x, y)
      const newTodo = cxz(IonicTodo)(todo)
      console.log('other stuff', fromNub(ScoreBoard.stuff))
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
      console.log('other stuff', fromNub(ScoreBoard.stuff))

   }, { contextualize: { useSelection, IonicTodo } })

   ionicRenderTask(async o => {
      o.setup(() =>
         setInterval(() => {
            console.log("hi")
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = o.useSelection(x, y)
      const newTodo = o.IonicTodo(todo)
      console.log('other stuff', o.fromNub(ScoreBoard.stuff))

   }, { contextualize: { useSelection, IonicTodo } })

   ionicRenderTask(async ({ run, setup }) => {
      setup(() =>
         setInterval(() => coop(() => {
            console.log("hi")
         }), 500)
      ).cleanup(clearInterval)
      await coop(render())
      await coop(res => {
         if (res.error) {
            $error.value = res.error
            return;
         }
         const { } = useSelection(x, y)
         const newTodo = IonicTodo(todo)
         console.log('other stuff', fromNub(ScoreBoard.stuff))
      })
      return coop()
   })


   ionicRenderTask(async ({ span, spot, tethered, setup }) => {
      setup((count = 0) =>
         setInterval(tethered(() => {
            count++
            console.log("hi", count)
         }), 500)
      ).cleanup(clearInterval)
      await span(render())
      await spot(res => {
         if (res.error) {
            $error.value = res.error
            return;
         }
         const { } = useSelection(x, y)
         const newTodo = IonicTodo(todo)
         console.log('other stuff', fromNub(ScoreBoard.stuff))
      })
   })

   ionicRenderTask(async ({ span, spot, tether, setup }) => {
      setup((count = 0) =>
         setInterval(tethered(() => {
            count++
            console.log("hi", count)
         }), 500)
      ).cleanup(clearInterval)
      await span(o => render())
      await spot(o => {
         const { } = useSelection(x, y)
         const newTodo = IonicTodo(todo)
         console.log('other stuff', fromNub(ScoreBoard.stuff))
      })
   })

   ionicRenderTask(async ({ span, spot, tether, setup }) => {
      setup((count = 0) =>
         setInterval(tethered(() => {
            count++
            console.log("hi", count)
         }), 500)
      ).cleanup(clearInterval)
      await render()
      const { } = useSelection(x, y)
      const newTodo = IonicTodo(todo)
      console.log('other stuff', fromNub(ScoreBoard.stuff))
   })

   function doSomething() {
      fetch('...')
         .then((res) => fetch('...' + res))
   }

   async function doSomething() {
      const res = await fetch('...')
      await fetch('...' + res)
   }

   async function doSomething() {
      try {
         await span(o => fetch('...'))
         await span(o => fetch('...' + o.data))
      }
      catch (err) {

      }
   }

   ionicRenderTask(async ({ span, spot, tether, setup }) => {
      setup((count = 0) =>
         setInterval(tethered(() => {
            count++
            console.log("hi", count)
         }), 500)
      ).cleanup(clearInterval)
      await render()
      tether(() => {
         const { } = useSelection(x, y)
         const newTodo = IonicTodo(todo)
         console.log('other stuff', fromNub(ScoreBoard.stuff))
      })
   })

   ionicRenderTask(async ({ span, spot, tether, setup }) => {
      setup((count = 0) =>
         setInterval(tethered(() => {
            count++
            console.log("hi", count)
         }), 500)
      ).cleanup(clearInterval)
      const res = await render()
      tether(() => {
         if (res.error) {
            $error.value = res.error
            return;
         }
         const { } = useSelection(x, y)
         const newTodo = IonicTodo(todo)
         console.log('other stuff', fromNub(ScoreBoard.stuff))
      })
   })

   ionicRenderTask(async ({ span, spot, tether, setup }) => {
      setup((count = 0) =>
         setInterval(tethered(() => {
            count++
            console.log("hi", count)
         }), 500)
      ).cleanup(clearInterval)
      const res = await render()
      if (res.error) {
         $error.value = res.error
         return;
      }
      const { } = useSelection(x, y)
      const newTodo = IonicTodo(todo)
      console.log('other stuff', fromNub(ScoreBoard.stuff))
   })

   // ionicRenderTask(async o => {
   //    o.setup((count = 0) =>
   //       setInterval(() => o.tether(() => {
   //          count++
   //          console.log("hi", count)
   //       }), 500)
   //    ).cleanup(clearInterval)
   //    await o.span(render())
   //    await o.spot(res => {
   //       if (res.error) {
   //          $error.value = res.error
   //          return;
   //       }
   //       const { } = useSelection(x, y)
   //       const newTodo = IonicTodo(todo)
   //       console.log('other stuff', fromNub(ScoreBoard.stuff))
   //    })
   // })

   ionicPostTask(async ({ setup, useSelection, IonicTodo }) => {
      setup((count = 0) =>
         setInterval(() => {
            count++
            console.log("hi", count)
         }, 500)
      ).cleanup(clearInterval)

      await render()
      const { } = useSelection(x, y)
      const newTodo = IonicTodo(todo)
      console.log('other stuff', fromNub(ScoreBoard.stuff))

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