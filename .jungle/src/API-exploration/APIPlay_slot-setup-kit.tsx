//@ts-nocheck
import { component, template, FromTag } from "luent";

function ColumnB() {

   return (

      <SomeComponent>
         {({ name } = SelectionKit()) =>
            <div>{name}</div>}
      </SomeComponent>
   )
}

function ColumnB() {
   // NOTE: slotSetup is only needed if the slot is used in a conditional... 
   // [ ] how do you pass both slot input and slot setup??
   // [ ] what is the syntax for passing setup kit to a conditional render function? I want to avoid passing an options object to If() or For(). optional parameter + jsx transform
   return (

      <SomeComponent>
         {({ name }) => (o = SelectionKit(),
            <div>{name} and {o.slide}</div>)}
      </SomeComponent>
   )
}


// Slot input type
// Slot === JSXNode
// Slot('?') === optional slot
// Slot<{ dog: string }> === render function
// Slot<{ dog: string }, '?'> === optional render function
// Slot<{ dog: string }, '?'>('?') === optional render function

function SomeComponent(input : {
   Slot: Slot
}) {
   return (

      ''
   )
}

function SelectionKit() {
}