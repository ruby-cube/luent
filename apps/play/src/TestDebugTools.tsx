//@ts-nocheck
import { component, listen } from "@rue/lumo";
import { traceable, debug, ion, ionize, watch } from "@rue/quarky";
import { $_run_with_, $_snap_context } from "../../../packages/flask/context/AsyncContext";
import { getActiveFlask } from "@rue/flask";



export function TestDebugApp() {

   //NOTE: traceable is meant to enable you to trace functions and methods defined externally
   // const doSomething = traceable('doSomething', input.doSomething)

   const $count = ion(0, {
      increment() {
         $count.state++
      },
      decrement() {
         $count.state--
      }
   })

   $count.label('$count')
   debug.traceTriggers($count)
   debug.traceCalls($count, 'decrement')
   debug.logAtoms($doublCount)

   const frog = ionize({
      name: { royalName: 'sir robin' },
      changeName() {
         this.name = { royalName: 'kermit' }
      }
   })

   function setSame() {
      $count.state = $count.state;
   }

   // debug.traceCalls(setSame)

   function refreshCounter() {
      console.log('log stuff')
      setSame()
      frog.changeName()
   }

   watch(frog, () => {

      watch($count, async (effect) => {
         // doSomething()
         const context = $_snap_context()

         await pause();

         // catch (err) {
         //    $_run_with_(context, () => {

         //    })
         // }
         // finally {
         //    $_run_with_(context, () => {

         //    })
         // }
         $_run_with_(context, () => {
            // const context = getAsyncContext()
            doSomething()
            // const context = getAsyncContext()
            // await pause()
            // $_run_with_(context, () => {
            //    return doSomething()
            // })
         })
      })
   })



   function doSomething() {
      debug.traceAsyncPath()
      // task.run()
      // console.trace()
      // console.log(getTrace())
      // console.createTask('testing')
   }


   function pause() {
      return new Promise(r => {
         setTimeout(r, 1)
      })
   }

   function incrementCount() {
      $count.increment()
   }


   return component(
      <>
         <div>{$count}</div>
         <button on:click={e => incrementCount()}>increment</button>
         <button on:click={e => $count.decrement()}>decrement</button>
         <button on:click={refreshCounter}>set same</button>
      </>
   )
}