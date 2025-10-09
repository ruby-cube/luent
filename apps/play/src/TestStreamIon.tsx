import { component, concatStreams, mergeStreams, StreamIon } from "@rue/lumo";
import './TestStreamIon.css'
import { Ion } from "@rue/quarky";

export function TestStreamIon() {


   const $bugEye = StreamIon({
      value: false,
      timer: {
         '@pre'() {
            this.value = true
         },
         interval: 500,
         run() {
            this.value = !this.value
         },
         x: 4,
         '@post'() {
            this.value = false
         }
      }
   })

   const $side = StreamIon({
      value: 'l',
      timer: {
         '@pre'() {
            this.value = 'r'
         },
         interval: 1000,
         run() {
            this.value = this.value === 'l' ? 'r' : 'l'
         },
         x: 3,
         '@post'() {
            this.value = 'l'
         }
      },
   })

   const $running = StreamIon({
      value: false as false | 3 | 4,
      timer: {
         '@pre'() {
            this.value = 3
         },
         interval: 125,
         run() {
            this.value = this.value === 3 ? 4 : 3
         },
         x: 32,
         '@post'() {
            this.value = false
         }
      }
   })

   const animation = concatStreams([mergeStreams([$side, $running]), $bugEye])

   const $frame = Ion(() =>
      $bugEye()
         ? 2
         : $running()
            ? $running()
            : 1
   )

   const $class = Ion(() => {
      return `${$side()}${$frame()}`
   })

   return component(
      <>
         <div class="logo">
            <div class={['bg dragon', $class]}></div>
         </div>
         <button on:click={e => { animation.start() }}>start</button>
         <button on:click={e => { animation.stop() }}>stop</button>
      </>
   )
}

