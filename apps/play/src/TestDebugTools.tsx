import { component, listen, watch } from "@rue/lumo";
import { ion, ionize } from "@rue/quarky";
import { getTrace, onTriggered, traceTriggers } from "../../../packages/lumo/src/watch/debug";
import { $thisEffect } from "../../../packages/quarky/src/effects/ThisEffect";

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


   if (__DEV__)
      traceTriggers(frog)

   function setSame() {
      $count.state = $count.state;
   }

   function refreshCounter() {
      console.log('log stuff')
      setSame()
      frog.changeName()
   }

   watch(frog, () => {
      watch($count, (effect) => {

      }, { until: $thisEffect()?.onCleanup })
   })

   return component(
      <>
         <div>{$count}</div>
         <button on:click={e => $count.increment()}>increment</button>
         <button on:click={e => $count.decrement()}>decrement</button>
         <button on:click={refreshCounter}>set same</button>
      </>
   )
}