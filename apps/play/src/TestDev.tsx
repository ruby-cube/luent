import { template } from "@rue/lumo";
import { dev, Ion, PRELUDE, SYNC, watch } from "@rue/quarky";

// COMPOUNDS
// [] multisubject
// [] ionic proxy subject
// [] ion subject
// [] functional subject (ionic task) (derivation)

export function TestDev() {
   const $count = Ion(1, {
      devName: '$count',
      increment() {
         $count.value++
      }
   })

   const $doubleCount = Ion(() => $count() * 2, {
      devName: '$doubleCount'
   })

   const $quadruple = Ion(() => $doubleCount() * 2, {
      devName: '$quadruple'
   })

   // dev.logAtoms($quadruple)
   // dev.traceMutations($quadruple)

   watch($count, () => {
      console.log('*** heheh A')
   }, {
      phase: SYNC,
      // once: true,
      devName: 'watch: () => $quadruple()',
      // 'dev.traceTriggers': true,
      'dev.logAtoms': true
   })
   watch($count, () => {
      console.log('*** heheh B')
   }, {
      phase: SYNC,
      // once: true,
      devName: 'watch: () => $quadruple()2',
      // 'dev.traceTriggers': true,
      'dev.logAtoms': true
   })

   // watch(() => $quadruple(), () => {
   //    console.log('*** heheh')
   // }, {
   //    // phase: SYNC,
   //    // once: true,
   //    devName: 'watch: () => $quadruple()',
   //    // 'dev.traceTriggers': true,
   //    // 'dev.logAtoms': true
   // })

   return template(
      <div on:click={e => $count.increment()}>{$count}</div>
   )
}