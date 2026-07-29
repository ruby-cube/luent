import { component, template } from "luent";
import { ion } from "@luent/quarky";

function TestMaybeIon() {
   const $msg = ion('hi')
   return (

      <Child msg={$msg}></Child>
   )
}

function Child({ msg }: { msg: Ion<string> }) {
   return (

      <div></div>
   )
}