import { template } from "@rue/luent";
import { Ion } from "@rue/quarky";

export function TestUndefinedTextNode() {
   const $msg = Ion(undefined as undefined | string)
   return template(
      <div on:click={e => $msg.value = 'hi'}>message: {$msg}</div>
   )
}