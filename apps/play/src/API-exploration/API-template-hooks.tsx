//@ts-nocheck
import { Component, $render, atCreate, atCreated, template } from "@rue/luent";

function doSomething() { }

function SomeComp() {


   return Component(
      <div at:create={Render(doSomething)}></div>
   )
}