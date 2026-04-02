//@ts-nocheck
import { $render, atCreate, atCreated, template } from "@rue/luent";

function doSomething() { }

function SomeComp() {


   return template(
      <div at:create={Render(doSomething)}></div>
   )
}