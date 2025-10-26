//@ts-nocheck
import { component, Stream } from "@rue/lumo"
import { Ion } from "@rue/quarky"
import { AnyObject } from "@rue/types";
import './TestStreamIon.css'

function encase<T>(fn: () => T) {
   return fn()
}


export function TestVanillaStream() {

   const $eye = Ion(1, {
      bug() { this.value = 2 },
      reset() { this.value = 1 },
      toggle() { this.value = this.value === 1 ? 2 : 1 }
   });

   const bugeye = Stream(async ({ interval, span }) => {
      await span(() => $eye.bug())
      await interval(500, () => $eye.toggle(), { max: 5 })
      await span(() => $eye.reset())
   }, { '@stop': () => $eye.reset() })

   const bugeyeB = Stream(ooo => {
      ooo.do(($eye.bug))
      ooo.interval(500, ($eye.toggle), { max: 5 })
      ooo.do(($eye.reset))
   }, { '@stop': ($eye.reset) })

   const $side = Ion('l' as 'l' | 'r')

   const turning = Stream(async ({ interval, span }) => {
      await span(() => $side.value = 'r')
      await interval(1000, () => $side.value = $side.value === 'l' ? 'r' : 'l', { max: 3 })
      await span(() => $side.value = 'l')
   }, { '@stop': () => $side.value = 'l' })


   const $running = Ion(false as false | 3 | 4)

   const running = Stream(async ({ interval, span }) => {
      await span(() => $running.value = 3)
      await interval(125, () => $running.value = $running.value === 3 ? 4 : 3, { max: 32 })
      await span(() => $running.value = false)
   }, { '@stop': () => $running.value = false })

   const animation = Stream(async ({ span, repeat }) => {
      await repeat(3, async () => {
         await span(turning, running)
         await span(bugeye)
      })
   })

   const animationB = Stream(ooo => {
      ooo.repeat(3, ooo => {
         ooo.stream(turning, running)
         ooo.stream(bugeye)
      })
   })

   const animationB = Stream(ooo => { // new AsyncSequence()
      ooo.repeat(3, ooo => {
         ooo.await(turning, running) // await() returns .then and .catch and can take in a then fn as last argument, span() does not
         ooo.await(bugeye)
      })
   })


   const $frame = Ion(() =>
      $running() ? $running() : $eye()
   )

   return component(
      <>
         <div class="logo">
            <div class={['bg dragon', (`${$side()}${$frame()}`)]}></div>
         </div>
         <button on:click={e => { animation.start() }}>start</button>
         <button on:click={e => { animation.stop() }}>stop</button>
      </>
   )
}

