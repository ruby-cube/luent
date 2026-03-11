import { FromTag, template } from "@rue/lumo";
import { Ion } from "@rue/quarky";

function TestMaybeIon() {
   const $msg = Ion('hi')
   return template(
      <Child msg={$msg}></Child>
   )
}

function Child({ msg }: FromTag<{ msg: Ion<string> }>) {
   return template(
      <div></div>
   )
}