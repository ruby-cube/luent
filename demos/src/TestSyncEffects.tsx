import { component, template } from "@rue/luent";
import { ion, SYNC, watch } from "@rue/quarky";

export function TestSyncEffects() {
   const $count = ion(0)
   watch($count, () => {
      console.log('count', $count())
   }, { phase: SYNC })

   return component(
      <div on:click={e => $count.value++}>Sync effects</div>
   )
}