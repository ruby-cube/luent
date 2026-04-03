import { template } from "@rue/luent";
import { ion } from "@rue/quarky";

export function TestRenderFunctionSlot() {
   return template(
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