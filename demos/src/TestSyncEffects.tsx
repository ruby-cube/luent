import { component, template } from "luent";
import { ion, SYNC, observe } from "@luent/quarky";

export function TestSyncEffects() {
   const $count = ion(0)
   observe($count, () => {
      console.log('count', $count())
   }, { phase: SYNC })

   return (

      <div on:click={e => $count.value++}>Sync reactions</div>
   )
}