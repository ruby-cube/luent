import { component } from "@rue/lumo";
import { ion, watch } from "@rue/quarky";
import { RENDER } from "../../../packages/lumo/src/render-cycle";

export function TestEffectCycle() {
   const $count = ion(0, {
      increment() {
         $count.state++
      },
      decrement() {
         $count.state--
      }
   })

   const $doubleCount = ion(() => $count() * 2)

   watch($doubleCount, () => {
      console.log("&% watch $doubleCount 0")
   })

   watch($doubleCount, ()=>{
      console.log("&% self-removing 1")
   }, {phase: RENDER, once: true})

   watch($doubleCount, ()=>{
      console.log("&% self-removing 2")
   }, {phase: RENDER, once: true})

   watch($doubleCount, () => {
      console.log("&% watch $doubleCount 1")
   }, {phase: RENDER})

   watch($doubleCount, () => {
      console.log("&% watch $doubleCount 2")

   },{phase: RENDER})

   watch($doubleCount, () => {
      console.log("&% watch $doubleCount 3")

   },{phase: RENDER})

   return component(
      <>
         <p>{$count}</p>
         <p>{$doubleCount}</p>
         <button on:click={$count.increment}>increment</button>
         <button on:click={$count.decrement}>decrement</button>
      </>
   )
}