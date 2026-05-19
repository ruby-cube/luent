import { Component, template } from "@rue/luent";
import m from "./TestStyling.module.css"

export function TestStyling() {
   
   return Component(
      <div class={[m.container, m.active]}>hi</div>
   )
}