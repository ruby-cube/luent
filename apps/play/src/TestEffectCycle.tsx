import { template } from "@rue/lumo";
import { ion, watch } from "@rue/quarky";
import { RENDER } from "../../../packages/quarky/src/reactivity/RenderCycle";

export function TestEffectCycle() {
   const $count = Ion(0, {
      increment() {
         $count.value++
      },
      decrement() {
         $count.value--
      }
   })

   const $doubleCount = Ion(() =>$count() * 2)

   watch($doubleCount, () => {
      console.log("&% watch $doubleCount 0")
   })

   watch($doubleCount, ()=>{
      console.log("&% self-removing 1")
   }, {once: true})

   watch($doubleCount, ()=>{
      console.log("&% self-removing 2")
   }, { once: true})

   watch($doubleCount, () => {
      console.log("&% watch $doubleCount 1")
   }, {})

   watch($doubleCount, () => {
      console.log("&% watch $doubleCount 2")

   },{})

   watch($doubleCount, () => {
      console.log("&% watch $doubleCount 3")

   },{})

   return template(
      <>
         <p>{$count}</p>
         <p>{$doubleCount}</p>
         <button on:click={$count.increment}>increment</button>
         <button on:click={$count.decrement}>decrement</button>
      </>
   )
}