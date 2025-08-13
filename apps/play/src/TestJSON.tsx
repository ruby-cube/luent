import { component } from "@rue/lumo";
import { ionize } from "@rue/quarky";

export function TestJSON() {
   const array = ionize([1,2])



   return component(
      <>
      <button on:click={e=>array.push(array.length)}>add</button>
      <pre id="raw">{(JSON.stringify(array, undefined, 2))}</pre>
      </>
   )
}