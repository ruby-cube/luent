//@ts-nocheck
import { component, $render, atCreate, atCreated, template } from "@rue/luent";

function doSomething() { }

function SomeComp() {


   return component(
      <div at:create={Render(doSomething)}></div>
   )
}