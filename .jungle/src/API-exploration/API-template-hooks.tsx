//@ts-nocheck
import { component, $render, beforeMount, atMount, template } from "@rue/luent";

function doSomething() { }

function SomeComp() {


   return component(
      <div pre:mount={Render(doSomething)}></div>
   )
}