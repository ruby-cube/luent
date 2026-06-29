//@ts-nocheck
import { component, $render, beforeMount, atMount, template } from "@rue/luent";

function doSomething() { }

function SomeComp() {


   return (

      <div before:mount={Render(doSomething)}></div>
   )
}