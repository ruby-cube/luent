//@ts-nocheck
import { component, $render, beforeInstall, atInstall, template } from "@rue/luent";

function doSomething() { }

function SomeComp() {


   return component(
      <div pre:install={Render(doSomething)}></div>
   )
}