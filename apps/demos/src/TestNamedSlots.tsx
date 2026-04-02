import './index.css'
import { createRoot, FromTag, RenderSlot, template } from "@rue/luent";

export function TestNamedSlots() {

   return template(
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

function Comp({ Slot }: FromTag<{ Slot: { title: RenderSlot, description: RenderSlot } }>) {
   return template(
      <div>
         {Slot.title}
         <hr></hr>
         {Slot.description}
      </div>
   )
}

if (__STYLE__) {
   createRoot(TestNamedSlots).mount('#root')
}