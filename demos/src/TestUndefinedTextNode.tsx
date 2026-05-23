import { component, template } from "@rue/luent";
import { ion } from "@rue/quarky";

export function TestUndefinedTextNode() {
   const $msg = ion(undefined as undefined | string)
   return component(
      <div on:click={e => $msg.value = 'hi'}>message: {$msg}</div>
   )
}