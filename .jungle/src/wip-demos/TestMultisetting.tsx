import { component, template } from "luent";
import { ion } from "@luent/quarky";

export function TestMultisetting() {
   const $frog = ion('kermit')

   function changeName() {
      $frog.value = 'sir robin'
      $frog.value = 'sir robin the brave'
      // frog.name = 'sir robin the brave'
   }

   return (

      <>
         <p>{$frog}</p>
         <button on:click={changeName}>click</button>
      </>
   )
}