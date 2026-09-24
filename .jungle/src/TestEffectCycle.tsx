import { component, template } from "luent";
import { ion, observe } from "@luent/quarky";

export function TestEffectCycle() {
   const $count = ion(0, {
      increment() {
         $count.value++
      },
      decrement() {
         $count.value--
      }
   })

   const $doubleCount = ion(() =>$count() * 2)

   observe($doubleCount, () => {
      console.log("&% observe $doubleCount 0")
   })

   observe($doubleCount, ()=>{
      console.log("&% self-removing 1")
   }, {once: true})

   observe($doubleCount, ()=>{
      console.log("&% self-removing 2")
   }, { once: true})

   observe($doubleCount, () => {
      console.log("&% observe $doubleCount 1")
   }, {})

   observe($doubleCount, () => {
      console.log("&% observe $doubleCount 2")

   },{})

   observe($doubleCount, () => {
      console.log("&% observe $doubleCount 3")

   },{})

   return (

      <>
         <p>{$count}</p>
         <p>{$doubleCount}</p>
         <button on:click={$count.increment}>increment</button>
         <button on:click={$count.decrement}>decrement</button>
      </>
   )
}