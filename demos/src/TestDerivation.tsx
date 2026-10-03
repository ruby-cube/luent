import { $$, component, For, template } from "luent";
import { ionic, SYNC, observe } from "@luent/quarky";



export function TestDerivation() {
   const count = ionic({
      value: 0
   })

   observe(() => count.value, () => {
      console.log('label', count.value) // This runs on count value change
   }, { phase: SYNC })

   return (

      <button on:click={e => count.value++}>+</button>
   )
}

export function TestDerivationA() {
   const count = ionic({
      value: 0
   })

   observe(() => count.value, () => {
      console.log('labelA', /* count.value */) // This FAILS to run on count value change
   }, { phase: SYNC })

   observe($$(count).value, () => {
      console.log('pion', /* count.value */)
   }, { phase: SYNC })

   return (

      <button on:click={e => count.value++}>+</button>
   )
}

export function TestDerivationB() {
   const count = ionic({
      value: 0
   })

   $$(count).value

   observe(() => count.value, () => {
      console.log('label', count.value) // This runs on count value change
   }, { phase: SYNC })

   observe($$(count).value, () => {
      console.log('pion', count.value)
   }, { phase: SYNC })



   return (

      <button on:click={e => count.value++}>+</button>
   )
}

export function TestDerivationD() {
   const count = ionic({
      value: 0
   })

   count.value

   observe(() => count.value, () => {
      console.log('label', count.value) // This FAILS
   }, { phase: SYNC })

   observe($$(count).value, () => {
      console.log('pion', count.value)
   }, { phase: SYNC })



   return (

      <button on:click={e => count.value++}>+</button>
   )
}


export function TestDerivationC() {
   const count = ionic({
      value: 0
   })

   observe($$(count).value, () => {
      console.log('pion', count.value)
   }, { phase: SYNC })

   observe(() => count.value, () => {
      console.log('label', count.value) // This runs on count value change
   }, { phase: SYNC })



   return (

      <button on:click={e => count.value++}>+</button>
   )
}