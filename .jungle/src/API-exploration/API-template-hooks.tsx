//@ts-nocheck
import { component, $render, beforeMount, atMount, template } from "@rue/luent";

function doSomething() { }

function SomeComp() {


   return component(
      <div before:mount={Render(doSomething)}></div>
   )
}