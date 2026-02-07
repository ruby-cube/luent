import { component } from "@rue/lumo";
import { Ion } from "@rue/quarky";

export function TestRenderFunctionSlot() {
   return component(
      <div>
         <div></div>
         <section>{() => {
            const $tab = Ion(1)
            return <><p>hi</p></>
         }}
         </section>
      </div>
   )
}