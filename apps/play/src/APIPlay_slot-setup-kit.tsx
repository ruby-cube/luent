//@ts-nocheck
import { component, fromTag } from "@rue/lumo";

function ColumnB() {

   return component(
      <SomeComponent>
         {({ name }=SelectionKit()) =>
            <div>{name}</div>}
      </SomeComponent>
   )
}

function ColumnB() {

   return component(
      <SomeComponent slotSetup={SelectionKit}>
         {({ name }) =>
            <div>{name}</div>}
      </SomeComponent>
   )
}

function SomeComponent(input = fromTag()) {
   return component(
      ''
   )
}

function SelectionKit() {
}