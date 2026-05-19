import { $of, Component, For, template } from "@rue/luent";
import { ionic, SYNC, watch } from "@rue/quarky";



export function TestDerivation() {
   const count = ionic({
      value: 0
   })

   watch(() => count.value, () => {
      console.log('label', count.value) // This runs on count value change
   }, { phase: SYNC })

   return Component(
      <button on:click={e => count.value++}>+</button>
   )
}

export function TestDerivationA() {
   const count = ionic({
      value: 0
   })

   watch(() => count.value, () => {
      console.log('labelA', /* count.value */) // This FAILS to run on count value change
   }, { phase: SYNC })

   watch($of(count).value, () => {
      console.log('pion', /* count.value */)
   }, { phase: SYNC })

   return Component(
      <button on:click={e => count.value++}>+</button>
   )
}

export function TestDerivationB() {
   const count = ionic({
      value: 0
   })

   $of(count).value

   watch(() => count.value, () => {
      console.log('label', count.value) // This runs on count value change
   }, { phase: SYNC })

   watch($of(count).value, () => {
      console.log('pion', count.value)
   }, { phase: SYNC })



   return Component(
      <button on:click={e => count.value++}>+</button>
   )
}

export function TestDerivationD() {
   const count = ionic({
      value: 0
   })

   count.value

   watch(() => count.value, () => {
      console.log('label', count.value) // This FAILS
   }, { phase: SYNC })

   watch($of(count).value, () => {
      console.log('pion', count.value)
   }, { phase: SYNC })



   return Component(
      <button on:click={e => count.value++}>+</button>
   )
}


export function TestDerivationC() {
   const count = ionic({
      value: 0
   })

   watch($of(count).value, () => {
      console.log('pion', count.value)
   }, { phase: SYNC })

   watch(() => count.value, () => {
      console.log('label', count.value) // This runs on count value change
   }, { phase: SYNC })



   return Component(
      <button on:click={e => count.value++}>+</button>
   )
}