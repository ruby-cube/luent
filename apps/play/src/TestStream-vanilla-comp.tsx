
// composability only

import { Component, template } from "@rue/luent"
import { ion } from "@rue/quarky"


function TestVanillaStream() {
   const $eye = ion(1, {
      bug() { this.value = 2 },
      reset() { this.value = 1 },
      toggle() { this.value = this.value === 1 ? 2 : 1 }
   });

   function bugeye() {
      $eye.bug()

      let x = 0
      const id = setInterval(() => {
         $eye.toggle()
         x++
         if (x === 5) {
            clearInterval(id)
            $eye.reset()
         }
      }, 500)
   }

   const $side = ion('l' as 'l' | 'r')

   function side() {
      $side.value = 'r'

      let x = 0
      const id = setInterval(() => {
         $side.value = $side.value === 'l' ? 'r' : 'l'
         x++
         if (x === 3) {
            clearInterval(id)
            $side.value = 'l'
         }
      }, 1000)
   }

   const $legrun = ion(false as false | 3 | 4)

   function legrun() {
      $legrun.value = 3
      let x = 0
      const id = setInterval(() => {
         $legrun.value = $legrun.value === 3 ? 4 : 3
         x++
         if (x === 32) {
            clearInterval(id)
            $legrun.value = false
         }
      }, 1000)
   }


   function animate(){
      
   }


   const $frame = ion(() =>
      $eye()
         ? 2
         : $legrun()
            ? $legrun()
            : 1
   )

   return Component(
      <>
         <div class="logo">
            <div class={['bg dragon', (`${$side()}${$frame()}`)]}></div>
         </div>
         <button on:click={animate}>start</button>
         {/* <button on:click={e => { animation.start() }}>stop</button> */}
      </>
   )
}



