import './index.css'
import { component, mountIsland, RenderSlot, template } from "luent";

export function TestNamedSlots() {

   return (

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
   return (

      <div>
         {Slot.title}
         <hr></hr>
         {Slot.description}
      </div>
   )
}

if (__STYLE__) {
   mountIsland(TestNamedSlots, '#root')
}