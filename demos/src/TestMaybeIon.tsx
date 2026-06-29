import { component, template } from "@rue/luent";
import { ion } from "@rue/quarky";

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