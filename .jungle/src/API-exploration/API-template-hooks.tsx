//@ts-nocheck
import { component, $render, beforeMount, atMount, template } from "luent";

function doSomething() { }

function SomeComp() {


   return (

      <div before:mount={Render(doSomething)}></div>
   )
}