//@ts-nocheck
import { FromTag, RenderSlot, template } from "@rue/lumo";

// [x] Distinguishing getter from render function
//    - static analysis of functions defined in template (arrow functions) ---> function SlotA() { return }
//    - slot helper for slots defined outside of template  // X this seems like too much :( .. maybe just treat render functions as getters
//    - capitalized name or start with render__
//    - CURRENT SOLUTION: No need to distinguish from the function, the template will distinguish via the output
// [x] a render function in jsx expression container with other children?
//    - treat it like an ion. if Content.length !== 0 throw error
// [x] named slots
//    - object MUST be defined in template and must be the only child
//    - render function may be defined elsewhere
// [X] Slot needs to be explicitly defined by FromTag
// [X] must error if slot is defined twice (don't allow slot to be defined as an attribute)



function TestSlotO() {
   const ContentA = () => (
      <div></div>
   )
   const ContentB = () => (
      <div></div>
   )
   return template(
      <Comp>{{
         ContentA,
         ContentB
      }}</Comp>
   )
}

function TestSlotO() {

   return template(
      <Comp>{{
         ContentA: () => (
            <div></div>
         ),
         ContentB: () => (
            <div></div>
         )
      }}</Comp>
   )
}

function TestSlotO() {

   const namedSlots = {
      Content: (o) => (
         <div></div>
      )
   }

   // if Content.length !== 0 throw error
   // QUESTION: What happens if you watch a render function that renders its own ions?
   return template(
      <Comp>{namedSlots} hi</Comp>
   )
}

function TestSlotO() {

   function Content(o) {
      return (
         <div></div>
      )
   }

   // if Content.length !== 0 throw error
   // QUESTION: What happens if you watch a render function that renders its own ions?
   return template(
      <Comp>{Content} hi</Comp>
   )
}

function TestSlotO() {

   function makeContent() {
      return o => (
         <div></div>
      )
   }


   return template(
      <Comp>{makeContent()}</Comp>
   )
}

function TestSlotO() {

   function Content(o) {
      return (
         <div></div>
      )
   }


   return template(
      <Comp>{Content}</Comp>
   )
}

function TestSlotO() {

   const Content = Slot(o => (
      <div></div>
   ))


   return template(
      <Comp>{Content}</Comp>
   )
}

function TestSlotA() {
   return template(
      <Comp>{o => (
         <div></div>
      )}</Comp>
   )
}

function TestSlotA() {
   return template(
      <Comp>
         {o => (
            <div></div>
         )}
      </Comp>
   )
}

// UGLY
function TestSlotC() {
   return template(
      <Comp>{Slot(() => (
         <div></div>
      ))}</Comp>
   )
}

function TestSlotB() {
   return template(
      <Comp>{{
         Slot: () => (
            <div></div>
         )
      }}</Comp>
   )
}

function Comp({ Slot }: FromTag<{ Slot: RenderSlot<{}> }>) {
   return template(
      <div></div>
   )
}

function Slot(fn: RenderSlot) {
   return fn
}