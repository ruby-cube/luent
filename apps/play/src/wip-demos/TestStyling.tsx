import { template } from "@rue/luent";
import m from "./TestStyling.module.css"

export function TestStyling() {
   
   return template(
      <div class={[m.container, m.active]}>hi</div>
   )
}