import { component, template } from "luent";
import { dev, ion, PRELUDE, SYNC, observe } from "@luent/quarky";

// COMPOUNDS
// [] multisubject
// [] ionic proxy subject
// [] ion subject
// [] functional subject (ionic task) (derivation)

export function TestDev() {
   const $count = ion(1, {
      devName: '$count',
      increment() {
         $count.value++
      }
   })

   const $doubleCount = ion(() => $count() * 2, {
      devName: '$doubleCount'
   })

   const $quadruple = ion(() => $doubleCount() * 2, {
      devName: '$quadruple'
   })

   // dev.logAtoms($quadruple)
   // dev.traceMutations($quadruple)

   observe($count, () => {
      console.log('*** heheh A')
   }, {
      phase: SYNC,
      // once: true,
      devName: 'observe: () => $quadruple()',
      // 'dev.traceTriggers': true,
      'dev.logAtoms': true
   })
   observe($count, () => {
      console.log('*** heheh B')
   }, {
      phase: SYNC,
      // once: true,
      devName: 'observe: () => $quadruple()2',
      // 'dev.traceTriggers': true,
      'dev.logAtoms': true
   })

   // observe(() => $quadruple(), () => {
   //    console.log('*** heheh')
   // }, {
   //    // phase: SYNC,
   //    // once: true,
   //    devName: 'observe: () => $quadruple()',
   //    // 'dev.traceTriggers': true,
   //    // 'dev.logAtoms': true
   // })

   return (

      <div on:click={e => $count.increment()}>{$count}</div>
   )
}