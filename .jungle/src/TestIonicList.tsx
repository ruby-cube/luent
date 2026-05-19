import { Component, template, For } from "@rue/luent";
import { ionic, Ionic } from "@rue/quarky";

export function TestIonicList() {
   const list = ionic([1, 2, 3])
   return Component(
      <div>
         <button on:click={e => list.push((list.at(-1) ?? 0) + 1)}>add</button>
         <button on:click={e => list.pop()}>pop</button>
         {For(list, m => m, item =>
            <div>{item}</div>
         )}
      </div>
   )
}