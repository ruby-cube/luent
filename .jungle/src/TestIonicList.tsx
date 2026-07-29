import { component, template, For } from "luent";
import { ionic, Ionic } from "@luent/quarky";

export function TestIonicList() {
   const list = ionic([1, 2, 3])
   return (

      <div>
         <button on:click={e => list.push((list.at(-1) ?? 0) + 1)}>add</button>
         <button on:click={e => list.pop()}>pop</button>
         {For(list, m => m, item =>
            <div>{item}</div>
         )}
      </div>
   )
}