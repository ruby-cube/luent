import { component } from "@rue/lumo";
import { Ion, Ionized } from "@rue/quarky";

export function TestMultisetting() {
   const $frog = Ion('kermit')

   function changeName() {
      $frog.value = 'sir robin'
      $frog.value = 'sir robin the brave'
      // frog.name = 'sir robin the brave'
   }

   return component(
      <>
         <p>{$frog}</p>
         <button on:click={changeName}>click</button>
      </>
   )
}