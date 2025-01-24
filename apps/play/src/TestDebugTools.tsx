import { component, listen} from "@rue/lumo";
import { ion, ionize, watch } from "@rue/quarky";
import { $thisEffect } from "../../../packages/quarky/src/effects/ThisEffect";
import { asyncTrace } from "../../../packages/flask/debug";
import {  $_run_with_, $_snap_context } from "../../../packages/flask/context/AsyncContext";
import { getActiveFlask } from "@rue/flask";



export function TestDebugApp() {
   const $count = ion(0, {
      increment() {
         $count.state++
      },
      decrement() {
         $count.state--
      }
   })

   const frog = ionize({
      name: { royalName: 'sir robin' },
      changeName() {
         this.name = { royalName: 'kermit' }
      }
   })

   const name = frog.name


   // if (__DEV__)
   // traceTriggers(frog)

   function setSame() {
      $count.state = $count.state;
   }

   function refreshCounter() {
      console.log('log stuff')
      setSame()
      frog.changeName()
   }

   watch(frog, () => {

      watch($count, async (effect) => {
         // doSomething()
         const context = $_snap_context()
         // console.log(context.activeNodes.get('trace'))

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
            // console.log(context.activeNodes.get('trace'))
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
      asyncTrace()
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


   return component(
      <>
         <div>{$count}</div>
         <button on:click={e => $count.increment()}>increment</button>
         <button on:click={e => $count.decrement()}>decrement</button>
         <button on:click={refreshCounter}>set same</button>
      </>
   )
}