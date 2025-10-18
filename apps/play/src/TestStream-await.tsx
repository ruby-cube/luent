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

   const bugeye = Stream(async ({ interval, run }) => {
      await run(() => $eye.bug())
      await interval(500, () => $eye.toggle(), { max: 5 })
      await run(() => $eye.reset())
   }, { '@stop': () => $eye.reset() })

   const $side = Ion('l' as 'l' | 'r')

   const turning = Stream(async ({ interval, run }) => {
      await run(() => $side.value = 'r')
      await interval(1000, () => $side.value = $side.value === 'l' ? 'r' : 'l', { max: 3 })
      await run(() => $side.value = 'l')
   }, { '@stop': () => $side.value = 'l' })


   const $running = Ion(false as false | 3 | 4)

   const running = Stream(async ({ interval, run }) => {
      await run(() => $running.value = 3)
      await interval(125, () => $running.value = $running.value === 3 ? 4 : 3, { max: 32 })
      await run(() => $running.value = false)
   }, { '@stop': () => $running.value = false })

   const animation = Stream(async ({ run, repeat }) => {
      await repeat(3, async () => {
         await run(turning, running)
         await run(bugeye)
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

