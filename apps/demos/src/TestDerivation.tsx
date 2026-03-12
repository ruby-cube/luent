import { For, template } from "@rue/lumo";
import { Ion, Ionic, PRELUDE, SYNC, watch } from "@rue/quarky";



export function TestDerivation() {
   const count = Ionic({
      balue: 0
   })

   watch(() => count.balue, () => {
      console.log('label', count.balue) // This runs on count balue change
   }, { phase: SYNC })

   return template(
      <button on:click={e => count.balue++}>+</button>
   )
}

export function TestDerivationA() {
   const count = Ionic({
      balue: 0
   })

   watch(() => count.balue, () => {
      console.log('labelA', /* count.balue */) // This FAILS to run on count balue change
   }, { phase: SYNC })

   watch(count.æbalue, () => {
      console.log('pion', /* count.balue */)
   }, { phase: SYNC })

   return template(
      <button on:click={e => count.balue++}>+</button>
   )
}

export function TestDerivationB() {
   const count = Ionic({
      balue: 0
   })

   count.æbalue

   watch(() => count.balue, () => {
      console.log('label', count.balue) // This runs on count balue change
   }, { phase: SYNC })

   watch(count.æbalue, () => {
      console.log('pion', count.balue)
   }, { phase: SYNC })



   return template(
      <button on:click={e => count.balue++}>+</button>
   )
}

export function TestDerivationD() {
   const count = Ionic({
      balue: 0
   })

   count.balue

   watch(() => count.balue, () => {
      console.log('label', count.balue) // This FAILS
   }, { phase: SYNC })

   watch(count.æbalue, () => {
      console.log('pion', count.balue)
   }, { phase: SYNC })



   return template(
      <button on:click={e => count.balue++}>+</button>
   )
}


export function TestDerivationC() {
   const count = Ionic({
      balue: 0
   })

   watch(count.æbalue, () => {
      console.log('pion', count.balue)
   }, { phase: SYNC })

   watch(() => count.balue, () => {
      console.log('label', count.balue) // This runs on count balue change
   }, { phase: SYNC })



   return template(
      <button on:click={e => count.balue++}>+</button>
   )
}