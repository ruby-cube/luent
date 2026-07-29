import { component, template, For } from "luent";
import { ionic } from "@luent/quarky";

export function TestForObjectKeys() {
   const obj = ionic({
      a: 1,
      b: 2,
      c: 3
   })
   return (

      <div>
         {For(obj, (key) => {
            return (
               <p>{key} - {(obj[key])}</p>
            )
         })}
         <button on:click={e => obj.a = Infinity}>click</button>
      </div>
   )
}
