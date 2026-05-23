import { component, FromTag, template } from "@rue/luent";
import { ion } from "@rue/quarky";

function TestMaybeIon() {
   const $msg = ion('hi')
   return component(
      <Child msg={$msg}></Child>
   )
}

function Child({ msg }: FromTag<{ msg: Ion<string> }>) {
   return component(
      <div></div>
   )
}