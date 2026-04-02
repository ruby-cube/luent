import { template } from "@rue/luent";
import { Ion, SYNC, watch } from "@rue/quarky";

export function TestSyncEffects() {
   const $count = Ion(0)
   watch($count, () => {
      console.log('count', $count())
   }, { phase: SYNC })

   return template(
      <div on:click={e => $count.value++}>Sync effects</div>
   )
}