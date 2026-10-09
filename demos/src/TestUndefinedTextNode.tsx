import { component, template } from "luent";
import { ion } from "@luently/quarky";

export function TestUndefinedTextNode() {
   const $msg = ion(undefined as undefined | string)
   return (

      <div on:click={e => $msg.value = 'hi'}>message: {$msg}</div>
   )
}