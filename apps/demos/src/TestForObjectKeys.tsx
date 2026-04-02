import { template, For } from "@rue/luent";
import { asIonic, Ionic } from "@rue/quarky";

export function TestForObjectKeys() {
   const obj = asIonic({
      a: 1,
      b: 2,
      c: 3
   })
   return template(
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
