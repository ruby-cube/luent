import { template } from "@rue/luent";
import { Ion, Ionized } from "@rue/quarky";

export function TestMultisetting() {
   const $frog = Ion('kermit')

   function changeName() {
      $frog.value = 'sir robin'
      $frog.value = 'sir robin the brave'
      // frog.name = 'sir robin the brave'
   }

   return template(
      <>
         <p>{$frog}</p>
         <button on:click={changeName}>click</button>
      </>
   )
}