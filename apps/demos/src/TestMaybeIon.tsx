import { FromTag, template } from "@rue/luent";
import { ion } from "@rue/quarky";

function TestMaybeIon() {
   const $msg = ion('hi')
   return template(
      <Child msg={$msg}></Child>
   )
}

function Child({ msg }: FromTag<{ msg: Ion<string> }>) {
   return template(
      <div></div>
   )
}