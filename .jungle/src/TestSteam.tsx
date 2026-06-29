//@ts-nocheck
import { component, template } from "@rue/luent";
import { Ion, ion } from "@rue/quarky";
import { AnyObject } from "@rue/types";
import { max } from "date-fns";



// const bugeye = Stream(async () => {
//    $eye.bug()
//    await interval(500).while(() => (x < 5), () => {
//       $eye.toggle()
//    }, max(5))
//    $eye.reset()
// })

const bugeye = Stream(async ({ interval }) => {
   $eye.bug()

   await interval(500, () => {
      $eye.toggle()
      if (this.x === 5) this.clear()
   })

   $eye.reset()
})

const bugeye = Stream(async ({ interval }) => {
   $eye.bug()

   await interval(500, () => {
      $eye.toggle()
   }).max(5)

   $eye.reset()
})

// const bugeye = Stream(async ({ interval }) => {
//    $eye.bug()

//    await interval(500, { max: 5 }, () => {
//       $eye.toggle()
//    })

//    $eye.reset()
// })

// const increment = Stream(async () => {
//    await settle(running, turning)
//    await timeout(1000)
//    console.log('OK')
//    await interval(500, () => {
//       $count.value++;
//    }).max(5)
//    console.log('ALL DONE')
// })




export function TestStream() {


   const $count = ion(0)

   const increment = Stream(async ({ timeout }) => {
      await timeout(500)
      $count.value++
   })



   let id;

   function increment() {
      id = setTimeout(() => {
         $count.value++
      }, 500)
   }

   function stopIncrement() {
      clearTimeout(id)
   }


   return (

      <div>
         <p>{$count}</p>
         <button on:click={e => increment.start()}>start</button>
         <button on:click={e => increment.stop()}>start</button>
      </div>
   )
}
