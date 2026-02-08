import { component } from "@rue/lumo";
import m from "./TestStyling.module.css"

export function TestStyling() {
   
   return component(
      <div class={[m.container, m.active]}>hi</div>
   )
}