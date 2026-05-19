import { Component, FromTag, template } from "@rue/luent";
import { ion } from "@rue/quarky";

function TestMaybeIon() {
   const $msg = ion('hi')
   return Component(
      <Child msg={$msg}></Child>
   )
}

function Child({ msg }: FromTag<{ msg: Ion<string> }>) {
   return Component(
      <div></div>
   )
}