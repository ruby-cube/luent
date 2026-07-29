import { component, template } from "luent";
import { ion } from "@luent/quarky";

export function TestRenderFunctionSlot() {
   return (

      <div>
         <div></div>
         <section>{() => {
            const $tab = ion(1)
            return <><p>hi</p></>
         }}
         </section>
      </div>
   )
}