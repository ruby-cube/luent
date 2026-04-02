import { template, For } from "@rue/lumo";
import { asIonic, Ionic } from "@rue/quarky";

export function TestIonicList() {
   const list = asIonic([1, 2, 3])
   return template(
      <div>
         <button on:click={e => list.push((list.at(-1) ?? 0) + 1)}>add</button>
         <button on:click={e => list.pop()}>pop</button>
         {For(list, m => m, item =>
            <div>{item}</div>
         )}
      </div>
   )
}