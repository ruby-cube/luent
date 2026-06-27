import './index.css'
import { component, mount, RenderSlot, template } from "@rue/luent";

export function TestNamedSlots() {

   return component(
      <div class='p-10 border border-emerald-800'>
         <Comp>{{
            title: () =>
               <h1>Stormy Night</h1>,
            description: () =>
               <p>Lorem ipsum de fulctus</p>,
         }}</Comp>
      </div>
   )
}

function Comp({ Slot }: { Slot: { title: RenderSlot, description: RenderSlot } }) {
   return component(
      <div>
         {Slot.title}
         <hr></hr>
         {Slot.description}
      </div>
   )
}

if (__STYLE__) {
   mount(TestNamedSlots, '#root')
}