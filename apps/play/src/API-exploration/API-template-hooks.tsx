//@ts-nocheck
import { $render, atCreate, atCreated, template } from "@rue/lumo";

function doSomething() { }

function SomeComp() {


   return template(
      <div at:create={Render(doSomething)}></div>
   )
}