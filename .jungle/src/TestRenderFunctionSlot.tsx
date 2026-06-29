import { component, template } from "@rue/luent";
import { ion } from "@rue/quarky";

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